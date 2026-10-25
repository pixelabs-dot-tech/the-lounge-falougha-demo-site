/* =========================================================================
   The Lounge menu — edit this file to update the menu on the site.
   price:  a number in US dollars (null or left out hides it)
   sizes:  [['Small', 6], ['Large', 9]] for items sold in sizes
   tags:   short labels shown next to the name, e.g. 'new'
   img:    a photo in assets/img/dish/ (NAME.webp and NAME-t.webp)
   layout: 'cards' shows big photo cards; 'list' shows the full menu with tabs
   Sections with no items are hidden automatically.
   ========================================================================= */
(function () {
  window.LOUNGE_MENU = {
    currency: '$',
    layout: 'cards',
    sub: 'A few favourites from our kitchen. The full menu, with prices, is on jeetak.',
    sections: [
      { id: 'favourites', label: 'Favourites' }
    ],
    items: [
      { s: 'favourites', name: 'The Lebanese set menu', desc: 'A table of mezze and grills to share.', price: 22, unit: 'per person', img: 'set-menu' },
      { s: 'favourites', name: 'Fattoush', desc: 'Greens and vegetables with crisp fried bread and pomegranate molasses.', img: 'fattoush' },
      { s: 'favourites', name: 'Mezze to share', desc: 'Cold and hot plates for the middle of the table.', img: 'mezze-spread' },
      { s: 'favourites', name: 'Makanek', desc: 'Little Lebanese sausages, cooked with cherry tomatoes.', img: 'makanek' },
      { s: 'favourites', name: 'Shish tawouk', desc: 'Marinated chicken skewers, straight off the grill.', img: 'tawouk' },
      { s: 'favourites', name: 'Mixed grill platter', desc: 'Skewers, grilled vegetables, fries and garlic sauce.', img: 'mixed-grill' },
      { s: 'favourites', name: 'Turkish kunafa', desc: 'Golden shredded pastry with crushed pistachio.', img: 'kunafa' },
      { s: 'favourites', name: 'Coffee', desc: 'A little coffee, a little comfort.', img: 'latte' }
    ]
  };
})();
