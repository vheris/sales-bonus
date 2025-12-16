/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции

  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  if (index == 0) {
    return seller.profit * 0.15;
  } else if (index == 1 || index == 2) {
    return seller.profit * 0.1;
  } else if (index == total - 1) {
    return 0;
  } else {
    return seller.profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных

  if (!data || !Array.isArray(data.sellers) || data.sellers.length == 0) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций

  if (
    typeof options !== "object" ||
    typeof options.calculateBonus !== "function" ||
    typeof options.calculateRevenue !== "function"
  ) {
    throw new Error("Что-то пошло не так");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    sales_count: 0,
    revenue: 0,
    profit: 0,
    products_sold: {},
    top_products: [],
    bonus: 0,
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = sellerStats.reduce((acc, sellerStat) => {
    acc[sellerStat.seller_id] = sellerStat;
    return acc;
  }, {});

  const productIndex = data.products.reduce((acc, product) => {
    acc[product.sku] = product;
    return acc;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id]; // Продавец

    if (!seller) {
      return; // Пропускаем запись, если продавец не найден
    }

    // Увеличить количество продаж
    seller.sales_count += 1;
    // Увеличить общую сумму всех продаж
    seller.revenue += record.total_amount;

    // Перебираем все товары в чеке для расчета себестоимости и прибыли
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = options.calculateRevenue(item, product);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      // Увеличить общую накопленную прибыль (profit) у продавца
      seller.profit += profit;
      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += 1;
    });
  });

  // @TODO: Сортировка продавцов по прибыли

  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((sellerStat, index) => {
    sellerStat.bonus = options.calculateBonus(
      index,
      sellerStats.length,
      sellerStat
    );

    sellerStats.top_products = Object.entries(sellerStat.products_sold).map(
      ([sku, quantity]) => ({
        sku,
        quantity,
      })
    )
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }))
}
