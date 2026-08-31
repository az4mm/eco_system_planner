# PDF generation service — creates styled bundle reports
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT


def generate_bundle_pdf(bundle) -> bytes:
    """Generate a styled PDF report for a bundle."""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    # Custom styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="DocTitle",
        fontSize=22,
        leading=28,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1e3a5f"),
        spaceAfter=6,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="Subtitle",
        fontSize=11,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#666666"),
        spaceAfter=16,
    ))
    styles.add(ParagraphStyle(
        name="SectionHead",
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#1e3a5f"),
        spaceAfter=8,
        spaceBefore=14,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="MetaLabel",
        fontSize=9,
        textColor=colors.HexColor("#888888"),
    ))
    styles.add(ParagraphStyle(
        name="MetaValue",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#222222"),
    ))

    elements = []

    # ── Title ──
    elements.append(Paragraph("⚡ TechPlanner", styles["DocTitle"]))
    elements.append(Paragraph("Personal Technology Ecosystem Planner — Bundle Report", styles["Subtitle"]))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3b82f6"), spaceAfter=10))

    # ── Bundle Info ──
    elements.append(Paragraph("Bundle Overview", styles["SectionHead"]))

    info_data = [
        ["Ecosystem", bundle.ecosystem],
        ["Usage Profile", bundle.usage_profile],
        ["Budget", f"₹{bundle.budget:,.0f}"],
        ["Total Price", f"₹{bundle.total_price:,.0f}"],
        ["Overall Score", f"{bundle.overall_score:.1f} / 100"],
        ["Compatibility", f"{bundle.compatibility_score:.1f} / 100"],
        ["Value Score", f"{bundle.value_score:.1f} / 100"],
    ]

    info_table = Table(info_data, colWidths=[120, 300])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#555555")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111111")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#eeeeee")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))

    # ── Products Table ──
    elements.append(Paragraph("Products in This Bundle", styles["SectionHead"]))

    table_header = ["#", "Category", "Brand", "Model", "Price", "Rating"]
    table_data = [table_header]

    for idx, item in enumerate(bundle.items, 1):
        product = item.product
        table_data.append([
            str(idx),
            item.category,
            product.brand,
            product.model,
            f"₹{product.price:,.0f}",
            f"⭐ {product.rating:.1f}",
        ])

    # Total row
    table_data.append(["", "", "", "TOTAL", f"₹{bundle.total_price:,.0f}", ""])

    product_table = Table(table_data, colWidths=[30, 80, 80, 140, 80, 60])
    product_table.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        # Data rows
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#dddddd")),
        # Total row
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEABOVE", (0, -1), (-1, -1), 1.5, colors.HexColor("#1e3a5f")),
        ("FONTSIZE", (0, -1), (-1, -1), 10),
        # Alternating row colors
        *[
            ("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f8fafc"))
            for i in range(2, len(table_data) - 1, 2)
        ],
        # Alignment
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (4, 0), (4, -1), "RIGHT"),
        ("ALIGN", (5, 0), (5, -1), "CENTER"),
    ]))
    elements.append(product_table)
    elements.append(Spacer(1, 20))

    # ── Footer ──
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc"), spaceAfter=8))
    elements.append(Paragraph(
        "Generated by TechPlanner — Personal Technology Ecosystem Planner",
        ParagraphStyle(name="Footer", fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor("#aaaaaa")),
    ))

    doc.build(elements)
    return buffer.getvalue()
