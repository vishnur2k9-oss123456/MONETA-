"""Synthetic data generator for SIH26184 backend.
Creates a handful of users, banks, ATMs, accounts, complaints and transactions.
Run with ``python scripts/generate_synthetic_data.py`` after the DB is initialised.
"""
import asyncio
import uuid
import random
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from app.database import engine, init_db
from app.models import User, Bank, ATMLocation, Account, Complaint, Transaction

NUM_USERS = 5
NUM_BANKS = 2
ATMS_PER_BANK = 3
ACCOUNTS_PER_USER = 2
COMPLAINTS_PER_USER = 2
TRANSACTIONS_PER_COMPLAINT = 5

async def create_entities():
    async with engine.begin() as conn:
        # Users
        users = []
        for i in range(NUM_USERS):
            email = f'user{i}@example.com'
            full_name = f'User {i}'
            hashed = "notarealhash"  # in real life use security.get_password_hash
            stmt = insert(User).values(email=email, full_name=full_name, hashed_password=hashed, role='officer')
            result = await conn.execute(stmt)
            users.append(result.inserted_primary_key[0])
        # Banks and ATMs
        banks = []
        atms = []
        for i in range(NUM_BANKS):
            name = f'Bank{i}'
            swift = f'BANK{i}SWIFT'
            stmt = insert(Bank).values(name=name, swift_code=swift)
            result = await conn.execute(stmt)
            bank_id = result.inserted_primary_key[0]
            banks.append(bank_id)
            for j in range(ATMS_PER_BANK):
                lat = 12.9 + random.random() * 0.1
                lon = 77.6 + random.random() * 0.1
                stmt = insert(ATMLocation).values(bank_id=bank_id, latitude=lat, longitude=lon, address=f'ATM {j} of {name}')
                await conn.execute(stmt)
        # Accounts per user linking to random bank
        accounts = []
        for user_id in users:
            for k in range(ACCOUNTS_PER_USER):
                acc_num = f'{user_id}{k}{random.randint(1000,9999)}'
                bank_id = random.choice(banks)
                stmt = insert(Account).values(account_number=acc_num, owner_name=f'Owner{user_id}', bank_id=bank_id)
                result = await conn.execute(stmt)
                accounts.append(result.inserted_primary_key[0])
        # Complaints and transactions
        for user_id in users:
            for c in range(COMPLAINTS_PER_USER):
                uid = str(uuid.uuid4())
                stmt = insert(Complaint).values(complaint_uid=uid, title='Synthetic Complaint', description='Generated for testing', owner_id=user_id)
                result = await conn.execute(stmt)
                complaint_id = result.inserted_primary_key[0]
                # Create transactions
                for t in range(TRANSACTIONS_PER_COMPLAINT):
                    sender = random.choice(accounts)
                    receiver = random.choice(accounts)
                    amount = round(random.uniform(100, 5000), 2)
                    ts = datetime.utcnow() - timedelta(hours=random.randint(0, 72))
                    stmt = insert(Transaction).values(
                        transaction_id=str(uuid.uuid4()),
                        complaint_id=complaint_id,
                        sender_account_id=sender,
                        receiver_account_id=receiver,
                        amount=amount,
                        timestamp=ts,
                        description='Synthetic transaction'
                    )
                    await conn.execute(stmt)
        await conn.commit()

async def main():
    await init_db()
    await create_entities()
    print('Synthetic data generated.')

if __name__ == '__main__':
    asyncio.run(main())
