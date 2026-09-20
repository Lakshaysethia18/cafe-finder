// ============================================
// CafeFinder Menu Module
// ============================================
window.CafeMenu = (() => {

  // Sample menu data (since Google Places API doesn't provide menus)
  const sampleMenus = {
    hot_drinks: {
      title: '☕ Hot Drinks',
      items: [
        { name: 'Espresso', description: 'Rich and bold single shot', price: 3.50 },
        { name: 'Americano', description: 'Espresso with hot water', price: 4.00 },
        { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 4.50 },
        { name: 'Latte', description: 'Espresso with steamed milk', price: 5.00 },
        { name: 'Mocha', description: 'Espresso with chocolate and steamed milk', price: 5.50 },
        { name: 'Flat White', description: 'Double espresso with microfoam', price: 5.00 },
        { name: 'Macchiato', description: 'Espresso marked with milk foam', price: 4.00 },
        { name: 'Hot Chocolate', description: 'Rich cocoa with steamed milk', price: 4.50 },
        { name: 'Chai Latte', description: 'Spiced tea with steamed milk', price: 4.50 },
        { name: 'Matcha Latte', description: 'Japanese green tea with milk', price: 5.50 },
      ]
    },
    cold_drinks: {
      title: '🧊 Cold Drinks',
      items: [
        { name: 'Iced Latte', description: 'Chilled espresso with cold milk', price: 5.50 },
        { name: 'Iced Americano', description: 'Espresso over ice', price: 4.50 },
        { name: 'Cold Brew', description: 'Slow-steeped 12-hour cold coffee', price: 5.00 },
        { name: 'Frappuccino', description: 'Blended iced coffee with cream', price: 6.00 },
        { name: 'Iced Mocha', description: 'Chocolate espresso over ice', price: 6.00 },
        { name: 'Smoothie Bowl', description: 'Acai blend with fresh toppings', price: 7.00 },
        { name: 'Fresh Lemonade', description: 'Hand-squeezed with mint', price: 4.00 },
      ]
    },
    pastries: {
      title: '🥐 Pastries & Baked Goods',
      items: [
        { name: 'Croissant', description: 'Flaky butter croissant', price: 3.50 },
        { name: 'Chocolate Muffin', description: 'Double chocolate chip', price: 3.00 },
        { name: 'Blueberry Scone', description: 'With lemon glaze', price: 3.50 },
        { name: 'Cinnamon Roll', description: 'Warm with cream cheese icing', price: 4.00 },
        { name: 'Banana Bread', description: 'Homemade with walnuts', price: 3.50 },
        { name: 'Cookie', description: 'Classic chocolate chip', price: 2.50 },
      ]
    },
    food: {
      title: '🥪 Light Bites',
      items: [
        { name: 'Avocado Toast', description: 'Sourdough with poached egg', price: 8.00 },
        { name: 'Grilled Sandwich', description: 'Cheese, tomato, pesto', price: 7.50 },
        { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan', price: 8.50 },
        { name: 'Granola Bowl', description: 'Greek yogurt, honey, berries', price: 6.50 },
        { name: 'Bagel & Cream Cheese', description: 'Toasted with herb spread', price: 5.00 },
      ]
    }
  };

  function render(containerId, cafeWebsite) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div class="menu-container">';
    html += '<div class="menu-header"><h3>Sample Menu</h3>';
    html += '<p class="menu-note">This is a representative menu. Actual items and prices may vary.</p>';
    if (cafeWebsite) {
      html += `<a href="${cafeWebsite}" target="_blank" rel="noopener" class="btn btn-secondary menu-link">🌐 View Actual Menu</a>`;
    }
    html += '</div>';

    Object.values(sampleMenus).forEach(category => {
      html += `
        <div class="menu-category">
          <h4 class="menu-category-title">${category.title}</h4>
          <div class="menu-items">
            ${category.items.map((item, i) => `
              <div class="menu-item ${i % 2 === 0 ? 'even' : 'odd'}">
                <div class="menu-item-info">
                  <span class="menu-item-name">${item.name}</span>
                  <span class="menu-item-desc">${item.description}</span>
                </div>
                <span class="menu-item-price">\$${item.price.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  return { render };
})();
