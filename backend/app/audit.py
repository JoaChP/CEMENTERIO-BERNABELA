from app.models import AuditLog


def log_action(session, actor, action, entity_type, entity_id, entity_name, before=None, after=None):
    session.add(AuditLog(actor_id=actor.id, actor_username=actor.username, action=action,
        entity_type=entity_type, entity_id=entity_id, entity_name=entity_name, before=before, after=after))


def user_snapshot(user):
    return {key: getattr(user, key) for key in ['username', 'full_name', 'role', 'is_active']}
