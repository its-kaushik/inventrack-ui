import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/currency';

interface LabelPreviewProps {
  storeName: string;
  productName: string;
  variantDescription: string;
  barcode: string;
  mrp: number;
  /** Label size in mm */
  widthMm?: number;
  heightMm?: number;
  className?: string;
}

/**
 * Single label preview with client-side barcode rendering via JsBarcode.
 * Scaled for screen display — actual print uses backend-generated PDF.
 */
export function LabelPreview({
  storeName,
  productName,
  variantDescription,
  barcode,
  mrp,
  widthMm = 50,
  heightMm = 25,
  className,
}: LabelPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && barcode) {
      try {
        JsBarcode(svgRef.current, barcode, {
          format: 'CODE128',
          width: 1.2,
          height: 30,
          displayValue: true,
          fontSize: 10,
          margin: 2,
          textMargin: 1,
        });
      } catch {
        // Invalid barcode — show placeholder
      }
    }
  }, [barcode]);

  // Scale factor: 1mm ≈ 3px for preview
  const scale = 3;
  const width = widthMm * scale;
  const height = heightMm * scale;

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-between overflow-hidden rounded border border-neutral-300 bg-white p-1',
        className,
      )}
      style={{ width, height }}
    >
      {/* Store name */}
      <p
        className="w-full truncate text-center font-bold leading-tight text-neutral-800"
        style={{ fontSize: 7 }}
      >
        {storeName}
      </p>

      {/* Product name + variant */}
      <div className="w-full text-center leading-tight" style={{ fontSize: 6 }}>
        <p className="truncate text-neutral-700">{productName}</p>
        {variantDescription && (
          <p className="truncate text-neutral-500">{variantDescription}</p>
        )}
      </div>

      {/* Barcode */}
      <svg ref={svgRef} className="w-full" />

      {/* MRP */}
      <p className="font-bold text-neutral-900" style={{ fontSize: 8 }}>
        MRP: {formatINR(mrp)}
      </p>
    </div>
  );
}
