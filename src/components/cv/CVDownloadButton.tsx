import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";

interface Props {
  cvRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
}

export function CVDownloadButton({ cvRef, fileName = "my-cv" }: Props) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    if (!cvRef.current) return;
    setLoading(true);
    try {
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={download}
      disabled={loading}
      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
      {loading ? "Generating PDF..." : "Download CV as PDF"}
    </button>
  );
}
