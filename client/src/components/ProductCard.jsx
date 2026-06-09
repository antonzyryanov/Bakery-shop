import useViewportCenterScale from '../hooks/useViewportCenterScale.js';

const ProductCard = ({ product, quantity, onIncrement, onDecrement }) => {
  const { ref, scale, opacity } = useViewportCenterScale();

  return (
    <article className="product-card surface" ref={ref} style={{ '--card-scale': scale, '--card-opacity': opacity }}>
      <img className="product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className="product-badge">{product.name.slice(0, 1)}</div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>

      <button className="price-btn" onClick={onIncrement}>
        {quantity > 0 ? (
          <span className="qty-controls">
            <span className="small-circle" onClick={(event) => {
              event.stopPropagation();
              onDecrement();
            }}>-</span>
            <strong>{quantity}</strong>
            <span className="small-circle" onClick={(event) => {
              event.stopPropagation();
              onIncrement();
            }}>+</span>
          </span>
        ) : (
          <>+ ${Number(product.price).toFixed(2)}</>
        )}
      </button>
    </article>
  );
};

export default ProductCard;
