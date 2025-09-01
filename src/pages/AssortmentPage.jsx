import React from "react";
import { ProductCard } from "../components/ProductCard/ProductCard";
import "./AssortmentPage.scss";
import caps from "../assets/caps.png";
import hoodie from "../assets/hoodie.png";
import tshirt from "../assets/tshirt.png";
import shorts from "../assets/shorts.png";
import backProfile from "../assets/backProfile.png";

const leftColumnProducts = [
  {
    id: 1,
    title: "Футболка",
    image: "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/tshirt.png",
    description: "Сидят, хорошо им наверное",
    height: 619.35,
  },
  {
    id: 2,
    title: "Шорты",
    image: "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/shorts.png",
    description: "Стоят, хорошо им наверное",
    height: 937,
  },
];

const rightColumnProducts = [
  {
    id: 3,
    title: "Худи",
    image: "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/hoodie.png",
    description: "Стоят, хорошо им наверное",
    height: 937,
  },
  {
    id: 4,
    title: "Кепки",
    image: "https://02adab20-6e64-4cd9-8807-03d155655166.selstorage.ru/caps.png",
    description: "Сидят, хорошо им наверное",
    height: 619.35,
  },
];

export const AssortmentPage = () => {
  return (
    <div
      className="assortment-page"
    >
      <h1 className="assortment-title">Ассортимент</h1>

      <div className="assortment-gallery">
        <div className="left-column">
          {leftColumnProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
        <div className="right-column">
          {rightColumnProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
};
