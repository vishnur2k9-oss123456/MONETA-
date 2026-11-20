"""Temporal graph intelligence service.
Creates a NetworkX DiGraph from transactions and stores a snapshot.
"""
import json
from datetime import datetime
from typing import List

import networkx as nx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.models import Transaction, TransactionGraph, Complaint

async def build_graph_for_complaint(db: AsyncSession, complaint_id: int) -> nx.DiGraph:
    # Fetch all transactions for the complaint
    result = await db.execute(select(Transaction).where(Transaction.complaint_id == complaint_id))
    transactions: List[Transaction] = result.scalars().all()
    G = nx.DiGraph()
    for tx in transactions:
        sender = f"account:{tx.sender_account_id}"
        receiver = f"account:{tx.receiver_account_id}"
        G.add_node(sender, type="account")
        G.add_node(receiver, type="account")
        G.add_edge(sender, receiver, amount=float(tx.amount), timestamp=tx.timestamp.isoformat())
    return G

async def store_graph_snapshot(db: AsyncSession, complaint_id: int, graph: nx.DiGraph) -> TransactionGraph:
    data = json.dumps(nx.node_link_data(graph))
    stmt = insert(TransactionGraph).values(
        complaint_id=complaint_id,
        snapshot_time=datetime.utcnow(),
        graph_data=data,
    ).returning(TransactionGraph)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

async def update_graphs_for_transactions(db: AsyncSession, transactions: List[Transaction]):
    # Group by complaint and rebuild/store graph for each affected complaint
    complaint_ids = {tx.complaint_id for tx in transactions}
    for cid in complaint_ids:
        graph = await build_graph_for_complaint(db, cid)
        await store_graph_snapshot(db, cid, graph)
