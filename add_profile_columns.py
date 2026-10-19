
from sqlalchemy import inspect, text
from src.backend.database import engine

new_columns = [
    "phone",
    "location",
    "bio",
    "education",
    "skills",
    "linkedin_url",
    "github_url",
]

existing_columns = {
    column["name"]
    for column in inspect(engine).get_columns("profile")
}

with engine.begin() as connection:
    for column in new_columns:
        if column not in existing_columns:
            connection.execute(
                text(
                    f"ALTER TABLE profile "
                    f"ADD COLUMN {column} VARCHAR NOT NULL DEFAULT ''"
                )
            )
            print(f"Added column: {column}")
        else:
            print(f"Already exists: {column}")

print("Profile database migration completed!")
