from datetime import datetime, timedelta, timezone
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

FOREST = colors.HexColor('#11634f')
INK = colors.HexColor('#263c33')
MUTED = colors.HexColor('#64756d')


def build_records_pdf(records, filters):
    stream = BytesIO()
    generated = datetime.now(timezone(timedelta(hours=-6)))
    document = SimpleDocTemplate(stream, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                                 topMargin=31*mm, bottomMargin=20*mm,
                                 title='Registro de difuntos - Campo Santo Nuestra Señora de Fátima',
                                 author='Campo Santo Nuestra Señora de Fátima')
    body = ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=15, textColor=INK, alignment=TA_LEFT, splitLongWords=True)
    label = ParagraphStyle('label', parent=body, fontSize=9, textColor=MUTED)
    notes_label = ParagraphStyle('notes_label', parent=label, keepWithNext=True)
    heading = ParagraphStyle('heading', parent=body, fontName='Helvetica-Bold', fontSize=15, leading=20, textColor=FOREST, spaceAfter=10)
    title = ParagraphStyle('title', parent=heading, fontSize=22, leading=28)

    def p(value, style=body):
        text = str(value) if value is not None and value != '' else 'No especificado'
        return Paragraph(escape(text).replace('\n', '<br/>'), style)

    def date_text(value):
        return value.strftime('%d/%m/%Y') if value else 'No especificada'

    def timestamp(value):
        if not value:
            return 'No especificada'
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone(timedelta(hours=-6))).strftime('%d/%m/%Y %H:%M')

    story = [p('Registro de difuntos', title), p(f"{len(records)} registros | Emitido: {generated.strftime('%d/%m/%Y %H:%M')} (Costa Rica)"), Spacer(1, 5*mm)]
    descriptions = filters.descriptions()
    story.append(p('Resultados de búsqueda' if descriptions else 'Todos los registros', heading))
    for item in descriptions:
        story.append(p(item))
    story.append(Spacer(1, 7*mm))
    if not records:
        story.append(p('No se encontraron registros para los filtros seleccionados.'))
    for index, record in enumerate(records, 1):
        rows = [
            ('CC (conocido como)', record.known_as),
            ('Fecha de nacimiento', date_text(record.date_of_birth)),
            ('Fecha de fallecimiento', date_text(record.date_of_death)),
            ('Fecha de sepultura', date_text(record.burial_date)),
            ('Sector', record.sector), ('Fila', record.row), ('Tumba o nicho', record.grave_number),
            ('ID del registro', record.id),
            ('Creación (Costa Rica)', timestamp(record.created_at)),
            ('Actualización (Costa Rica)', timestamp(record.updated_at)),
        ]
        table = Table([[p(key, label), p(value)] for key, value in rows], colWidths=[52*mm, 118*mm], hAlign='LEFT')
        table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor('#f2f7f4'), colors.white]),
            ('LEFTPADDING', (0, 0), (-1, -1), 9), ('RIGHTPADDING', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        details = [p(f'{index:02d}. {record.full_name}', heading), table, Spacer(1, 3*mm), p('Observaciones', notes_label), p(record.notes or 'Sin observaciones')]
        if len(record.notes or '') <= 1000:
            story.append(KeepTogether(details))
        else:
            story.extend([KeepTogether(details[:3]), *details[3:]])
        story.append(Spacer(1, 9*mm))

    def page_frame(canvas, doc):
        canvas.saveState()
        width, height = A4
        canvas.setFillColor(FOREST)
        canvas.setFont('Helvetica-Bold', 11)
        canvas.drawString(20*mm, height-15*mm, 'Campo Santo Nuestra Señora de Fátima')
        canvas.setStrokeColor(colors.HexColor('#d5e4dc'))
        canvas.line(20*mm, height-21*mm, width-20*mm, height-21*mm)
        canvas.line(20*mm, 14*mm, width-20*mm, 14*mm)
        canvas.setFillColor(MUTED)
        canvas.setFont('Helvetica', 8)
        canvas.drawString(20*mm, 10*mm, 'Registro administrativo | Bernabela, Santa Cruz, Guanacaste')
        canvas.drawRightString(width-20*mm, 10*mm, f'Página {doc.page}')
        canvas.restoreState()

    document.build(story, onFirstPage=page_frame, onLaterPages=page_frame)
    return stream.getvalue()
