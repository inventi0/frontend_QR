import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetProductByCodeQuery, useClaimProductMutation } from "../api/accountApi";
import { useGetMeQuery } from "../api/authApi";
import defaultAvatar from "../assets/Avatar.png";
import "./ActivationPage.scss";

export const ActivationPage = ({ isAuthenticated, onLoginRequest }) => {
  const { code } = useParams();
  const navigate = useNavigate();

  const {
    data: product,
    isLoading: productLoading,
    isError: productError,
  } = useGetProductByCodeQuery(code);

  const { data: me } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const [claimProduct, { isLoading: claiming, error: claimError }] =
    useClaimProductMutation();

  // Если футболка уже привязана к кому-то другому — сразу на публичный профиль
  useEffect(() => {
    if (!product?.is_claimed) return;
    // Если знаем текущего пользователя и это его футболка — ничего не делаем
    if (isAuthenticated && me && product.claimed_by_user_id === me.id) return;
    // Если пользователь ещё грузится — подождём
    if (isAuthenticated && !me) return;
    // Иначе — редирект на профиль владельца
    navigate(`/profile/${product.claimed_by_user_id}`, { replace: true });
  }, [product, me, isAuthenticated, navigate]);

  const handleClaim = async () => {
    try {
      await claimProduct(code).unwrap();
      navigate("/profile");
    } catch {
      // ошибка отображается из claimError
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (productLoading) {
    return (
      <div className="activation-page activation-page--center">
        <div className="spinner-ring" />
        <p>Загружаем данные футболки…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (productError || !product) {
    return (
      <div className="activation-page activation-page--center">
        <div className="activation-card activation-card--error">
          <h2>Футболка не найдена</h2>
          <p>Код активации не существует или был деактивирован.</p>
          <button className="activation-btn activation-btn--ghost" onClick={() => navigate("/")}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  // ── Already mine ──────────────────────────────────────────────────────────
  if (product.is_claimed && me && product.claimed_by_user_id === me.id) {
    return (
      <div className="activation-page activation-page--center">
        <div className="activation-card">
          <div className="activation-card__status activation-card__status--owned">
            <span className="activation-dot" /> Ваша футболка
          </div>
          <ProductPreview product={product} />
          <p className="activation-hint">
            Эта футболка уже привязана к вашему профилю.
          </p>
          <button className="activation-btn" onClick={() => navigate("/profile")}>
            Открыть профиль
          </button>
        </div>
      </div>
    );
  }

  // ── Unclaimed ─────────────────────────────────────────────────────────────
  return (
    <div className="activation-page activation-page--center">
      <div className="activation-card">
        <div className="activation-card__status activation-card__status--unclaimed">
          <span className="activation-dot activation-dot--pulse" /> Не привязана
        </div>

        <ProductPreview product={product} />

        <p className="activation-hint">
          Это ваша футболка? Привяжите её к профилю — тогда при каждом
          сканировании QR-кода будет открываться ваш холст.
        </p>

        {claimError && (
          <p className="activation-error">
            {claimError?.data?.detail || "Не удалось привязать. Попробуйте ещё раз."}
          </p>
        )}

        {isAuthenticated ? (
          <button
            className="activation-btn"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? "Привязываем…" : "Привязать к моему профилю"}
          </button>
        ) : (
          <div className="activation-auth-prompt">
            <p>Войдите или зарегистрируйтесь, чтобы привязать футболку.</p>
            <button className="activation-btn" onClick={onLoginRequest}>
              Войти
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Internal sub-component ────────────────────────────────────────────────────
function ProductPreview({ product }) {
  return (
    <div className="activation-product">
      <div className="activation-product__img-wrap">
        <img
          src={product.img_url || defaultAvatar}
          alt={product.type}
          className="activation-product__img"
        />
      </div>
      <div className="activation-product__info">
        <h2 className="activation-product__title">{product.type}</h2>
        <div className="activation-product__meta">
          <span>{product.size}</span>
          <span>·</span>
          <span>{product.color}</span>
        </div>
        {product.description && (
          <p className="activation-product__desc">{product.description}</p>
        )}
      </div>
    </div>
  );
}

export default ActivationPage;
