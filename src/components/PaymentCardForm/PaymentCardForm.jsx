import { useState } from "react";
import CustomInput from "../UI/CustomInput";
import "./PaymentCardForm.scss";
import mastercardLogo from "../../assets/mastercard.png";
import lockIcon from "../../assets/lock.svg";

const PaymentCardForm = ({ form, handleChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="payment-card-form">
      <div className="header" onClick={() => setDropdownOpen(!dropdownOpen)}>
        <span>Банковская карта</span>
        <div className="logo-dropdown">
          <img src={mastercardLogo} alt="Mastercard" />
          <span className={`arrow ${dropdownOpen ? "open" : ""}`}>
            {" "}
            <svg
              width="20"
              height="14"
              viewBox="0 0 20 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.4983 4.1102C19.0515 3.55695 19.0515 2.65996 18.4983 2.10671C17.945 1.55347 17.0481 1.55347 16.4948 2.10672L12.8267 5.77481C11.4934 7.10814 10.8267 7.77481 9.99832 7.77481C9.16989 7.77482 8.50322 7.10815 7.16989 5.77481L3.50179 2.10672C2.94854 1.55347 2.05156 1.55347 1.49831 2.10672C0.945073 2.65996 0.945074 3.55694 1.49832 4.11019L7.16989 9.78176C8.50322 11.1151 9.16989 11.7818 9.99832 11.7818C10.8267 11.7818 11.4934 11.1151 12.8267 9.78176L18.4983 4.1102Z"
                  fill="#3A3A3B"
                />
              </g>
              <defs>
                <clipPath id="clip0">
                  <rect
                    width="20"
                    height="13"
                    fill="white"
                    transform="translate(0 0.21875)"
                  />
                </clipPath>
              </defs>
            </svg>
          </span>
        </div>
      </div>
      {dropdownOpen && (
        <div className="card-dropdown">
          <div className="card-option">Mastercard</div>
          <div className="card-option">Visa</div>
          <div className="card-option">Мир</div>
        </div>
      )}

      <div className="card-fields">
        <div className="input-with-icon">
          <CustomInput
            name="cardNumber"
            value={form.cardNumber}
            onChange={handleChange}
            placeholder="Card Number"
            className="custom-input"
          />
          <img src={lockIcon} alt="lock" className="lock-icon" />
        </div>

        <div className="inline">
          <CustomInput
            name="expiration"
            value={form.expiration}
            onChange={handleChange}
            placeholder="Expiration Date"
            className="custom-input"
          />
          <CustomInput
            name="cvc"
            value={form.cvc}
            onChange={handleChange}
            placeholder="Security Code"
            className="custom-input"
          />
        </div>
        <CustomInput
          name="cardName"
          value={form.cardName}
          onChange={handleChange}
          placeholder="Card Holder Name"
          className="custom-input"
        />
        <label className="checkbox">
          <input
            type="checkbox"
            name="saveCard"
            checked={form.saveCard}
            onChange={handleChange}
          />
          Сохранить данные карты
        </label>
      </div>
    </div>
  );
};

export default PaymentCardForm;
