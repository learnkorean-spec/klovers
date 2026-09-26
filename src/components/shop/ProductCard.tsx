import { Link } from "react-router-dom";
import { formatPrice, productName, type ShopProduct } from "@/lib/shop";

/** Stripe-hosted product photo, lazy and sized; the slot stays ivory without one. */
export function ProductImage({ product, isAr, className = "", eager = false }: {
  product: ShopProduct; isAr: boolean; className?: string; eager?: boolean;
}) {
  const src = product.images[0];
  return (
    <div className={`overflow-hidden bg-ivory dark:bg-muted ${className}`}>
      {src && (
        <img
          src={src}
          alt={productName(product, isAr)}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={640}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

export function ProductCard({ product, isAr }: { product: ShopProduct; isAr: boolean }) {
  return (
    <Link
      to={`/shop/products/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ProductImage product={product} isAr={isAr} className="aspect-[4/5] rounded-xl" />
      <div className="flex flex-1 flex-col gap-1 px-1 pb-1 pt-3">
        {product.bookId && (
          <span className="w-fit rounded-full bg-klovers-yellow px-2.5 py-0.5 text-[11px] font-semibold text-charcoal">
            {isAr ? "كتاب رقمي" : "Digital book"}
          </span>
        )}
        <h3 className="font-display text-base font-semibold leading-snug text-foreground">
          {productName(product, isAr)}
        </h3>
        <p className="mt-auto pt-1 text-sm font-semibold text-foreground/80">
          {formatPrice(product.price.amount, product.price.currency, isAr)}
        </p>
      </div>
    </Link>
  );
}
