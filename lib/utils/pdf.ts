import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PIXELS_TO_MM = 0.264583;

export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string = "resume.pdf"
): Promise<void> {
  let tempContainer: HTMLElement | null = null;

  try {
    tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = `${element.offsetWidth}px`;
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.style.padding = "40px";
    tempContainer.style.color = "#000000";

    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.color = "#000000";
    clonedElement.style.backgroundColor = "#ffffff";

    const style = document.createElement("style");
    style.textContent = `
      .milkdown, .milkdown * {
        color: #000000 !important;
        background-color: #ffffff !important;
        font-family: Arial, Calibri, "Times New Roman", sans-serif !important;
      }
      .milkdown p, .milkdown h1, .milkdown h2, .milkdown h3, .milkdown h4, .milkdown h5, .milkdown h6,
      .milkdown li, .milkdown ul, .milkdown ol, .milkdown blockquote, .milkdown code, .milkdown pre {
        color: #000000 !important;
        font-family: Arial, Calibri, "Times New Roman", sans-serif !important;
      }
      .milkdown h1 {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 10px !important;
      }
      .milkdown h2 {
        font-size: 18px !important;
        font-weight: bold !important;
        margin-top: 16px !important;
        margin-bottom: 8px !important;
      }
      .milkdown h3 {
        font-size: 16px !important;
        font-weight: bold !important;
        margin-top: 12px !important;
        margin-bottom: 6px !important;
      }
      .milkdown p {
        font-size: 12px !important;
        line-height: 1.5 !important;
        margin: 4px 0 !important;
      }
      .milkdown ul, .milkdown ol {
        font-size: 12px !important;
        line-height: 1.5 !important;
        margin: 4px 0 !important;
        padding-left: 20px !important;
      }
      .milkdown li {
        font-size: 12px !important;
        line-height: 1.5 !important;
        margin: 2px 0 !important;
      }
      .milkdown svg, .milkdown svg * {
        stroke: #000000 !important;
        fill: #000000 !important;
      }
      .milkdown strong {
        font-weight: bold !important;
      }
      .milkdown hr {
        border: none !important;
        border-top: 1px solid #000000 !important;
        margin: 12px 0 !important;
      }
    `;
    tempContainer.appendChild(style);
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    document.body.removeChild(tempContainer);
    tempContainer = null;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidthMm = canvas.width * PIXELS_TO_MM;
    const imgHeightMm = canvas.height * PIXELS_TO_MM;
    
    const widthRatio = pdfWidth / imgWidthMm;
    const ratio = widthRatio;
    
    const imgScaledWidth = pdfWidth;
    const imgScaledHeight = imgHeightMm * ratio;
    const xOffset = 0;

    if (imgScaledHeight <= pdfHeight) {
      pdf.addImage(
        imgData,
        "PNG",
        xOffset,
        0,
        imgScaledWidth,
        imgScaledHeight
      );
    } else {
      let yPosition = 0;
      let pageNumber = 0;

      while (yPosition < imgScaledHeight) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        const yOffset = -pageNumber * pdfHeight;
        pdf.addImage(
          imgData,
          "PNG",
          xOffset,
          yOffset,
          imgScaledWidth,
          imgScaledHeight
        );

        yPosition += pdfHeight;
        pageNumber++;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF: ", error);
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    throw error;
  }
}

