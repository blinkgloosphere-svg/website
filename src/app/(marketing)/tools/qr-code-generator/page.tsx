import type { Metadata } from "next";
import { QrTool } from "./qr-tool";

export const metadata: Metadata = {
  title: "Google Review QR Code Generator",
  description: "Make a free, print-ready Google review QR code poster for your business in seconds.",
};

export default function QrCodeGeneratorPage() {
  return (
    <section className="py-14 sm:py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <p className="t-eyebrow">Free tool</p>
          <h1 className="t-title-1 mt-3">Google Review QR Code Generator</h1>
          <p className="t-lead mt-4">
            Search your business, pick a style, and download a poster that sends customers straight to your Google review form.
            No sign-up required.
          </p>
        </div>
        <div className="mt-12">
          <QrTool />
        </div>
      </div>
    </section>
  );
}
