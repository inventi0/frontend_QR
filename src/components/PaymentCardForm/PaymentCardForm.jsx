// import React from "react";
// import InputMask from "react-input-mask";
// import { useFormContext } from "react-hook-form";
// import classNames from "classnames";
// import "./PaymentCardForm.scss";

// const Field = ({ name, label, mask, placeholder }) => {
//   const {
//     register,
//     formState: { errors },
//   } = useFormContext();

//   return (
//     <div className="field">
//       <label>{label}</label>
//       <InputMask
//         mask={mask}
//         placeholder={placeholder}
//         {...register(name, { required: "Обязательное поле" })}
//         className={classNames("custom-input", {
//           error: errors[name],
//         })}
//       />
//       {errors[name] && (
//         <span className="error-text">{errors[name].message}</span>
//       )}
//     </div>
//   );
// };

// export default function PaymentCardForm() {
//   const { register } = useFormContext();
//   return (
//     <div className="cardWrapper">
//       <div className="cardHeader">Банковская карта</div>
//       <Field
//         name="cardNumber"
//         label="Номер карты"
//         mask="9999 9999 9999 9999"
//         placeholder="1234 5678 9012 3456"
//       />
//       <div className="inline">
//         <Field
//           name="expiration"
//           label="Срок действия"
//           mask="99/99"
//           placeholder="MM/YY"
//         />
//         <Field name="cvc" label="CVC" mask="999" placeholder="123" />
//       </div>
//       <Field
//         name="cardName"
//         label="Имя владельца"
//         mask={null}
//         placeholder="IVAN IVANOV"
//       />
//       <label className="checkbox">
//         <input type="checkbox" {...register("saveCard")} />
//         Сохранить данные карты
//       </label>
//     </div>
//   );
// }
