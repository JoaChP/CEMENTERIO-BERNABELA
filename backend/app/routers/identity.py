import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import require_admin

router = APIRouter(prefix="/api/identity", tags=["consulta de cédula"], dependencies=[Depends(require_admin)])


def extract_names(payload: dict, cedula: str) -> list[str]:
    names = []
    for item in payload.get("results", []) or []:
        if not isinstance(item, dict) or str(item.get("cedula", "")) != cedula:
            continue
        name = " ".join(str(item.get(key) or "").strip() for key in ("firstname", "lastname1", "lastname2")).strip()
        if not name:
            name = str(item.get("fullname") or "").strip()
        if name and name not in names:
            names.append(name)
    if not names and str(payload.get("cedula", "")) == cedula and str(payload.get("tipoIdentificacion")) == "01":
        name = str(payload.get("nombre") or "").strip()
        if name:
            names.append(name)
    return names


@router.get("")
def lookup_identity(cedula: str = Query(pattern=r"^[1-9][0-9]{8}$")) -> dict:
    try:
        response = httpx.get(f"https://apis.gometa.org/cedulas/{cedula}", timeout=10.0)
        if response.status_code == 429:
            raise HTTPException(429, "GoMeta alcanzó el límite de consultas. Esperá unos minutos y volvé a intentar.")
        if response.status_code == 404:
            raise HTTPException(404, "No se encontraron datos para esa cédula. Podés completar el registro manualmente.")
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError("Invalid response")
        names = extract_names(payload, cedula)
    except (httpx.HTTPError, ValueError, TypeError):
        raise HTTPException(502, "No se pudo consultar GoMeta. Podés completar el registro manualmente.") from None
    if not names:
        raise HTTPException(404, "No se encontraron datos para esa cédula. Podés completar el registro manualmente.")
    return {"cedula": cedula, "names": names, "source": "GoMeta"}
