import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Administrator


def main() -> None:
    username = input("Usuario administrador: ").strip()
    if not username or len(username) > 80:
        raise SystemExit("El usuario debe tener entre 1 y 80 caracteres.")

    password = getpass.getpass("Contraseña (mínimo 12 caracteres): ")
    confirmation = getpass.getpass("Repetí la contraseña: ")
    if len(password) < 12:
        raise SystemExit("La contraseña debe tener al menos 12 caracteres.")
    if password != confirmation:
        raise SystemExit("Las contraseñas no coinciden.")

    with SessionLocal() as session:
        exists = session.scalar(select(Administrator.id).where(Administrator.username == username))
        if exists:
            raise SystemExit("Ese usuario ya existe.")
        session.add(Administrator(username=username, password_hash=hash_password(password)))
        session.commit()
    print(f"Administrador {username!r} creado.")


if __name__ == "__main__":
    main()
