// masterDietData.js
const masterDietChart = {
  dailyAllowances: { 
    oil: { value: "3-4", unit: "Teaspoons" },
    sugar: { value: "0-2", unit: "Teaspoons" },
    water: { value: "2.5 - 3", unit: "Liters" },
    salt: { value: "Less than 5g", unit: "1 Teaspoon" }
  },
  sessions: [
    {
      sessionName: "Breakfast",
      time: "8:30 AM",
      items: [
        {
          categoryName: "Main Dish (Tiffins)",
          options: [
            "Idli (Rice / Millet)", "Dosa (Plain / Wheat / Ragi)", "Ven Pongal", 
            "Poori", "Upma (Rava / Aval / Wheat)", "Pesarattu", "Idiyappam"
          ],
          quantityValue: "2",
          unit: "Number / Cup"
        },
        {
          categoryName: "Accompaniment",
          options: [
            "Tiffin Sambar", "Coconut Chutney", "Tomato / Onion Chutney", 
            "Potato Masala", "Veg Stew"
          ],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Protein Addition",
          options: ["Boiled Egg", "Boiled Sundal (Chickpeas)"],
          quantityValue: "1",
          unit: "Number / Cup"
        }
      ]
    },
    {
      sessionName: "Lunch",
      time: "1:00 PM",
      items: [
        {
          categoryName: "Rice / Roti",
          options: [
            "White Rice", "Boiled / Red Rice", "Millet Rice", "Chapati"
          ],
          quantityValue: "1.5",
          unit: "Cup / Number"
        },
        {
          categoryName: "Main Gravy (Sambar / Dal)",
          options: [
            "Sambar", "Pappu (Dal)", "Vatha Kuzhambu", "Keerai Masiyal (Spinach)"
          ],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Rasam",
          options: ["Tomato Rasam", "Pepper / Jeera Rasam"],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Vegetable (Poriyal / Kootu)",
          options: [
            "Mixed Veg Poriyal", "Cabbage / Beans Poriyal", "Snake Gourd Kootu", "Lady's Finger Fry"
          ],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Non-Veg / High Protein (Optional)",
          options: [
            "Fish Curry", "Chicken Curry", "Soya Chunks Curry", "Paneer Masala"
          ],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Curd",
          options: ["Curd (Yogurt)", "Buttermilk"],
          quantityValue: "0.5",
          unit: "Cup"
        }
      ]
    },
    {
      sessionName: "Dinner",
      time: "8:00 PM",
      items: [
        {
          categoryName: "Main Dish",
          options: [
            "Chapati / Phulka", "Idli", "Wheat Dosa", "Oats Upma", "Semiya (Vermicelli) Upma"
          ],
          quantityValue: "2",
          unit: "Number / Cup"
        },
        {
          categoryName: "Accompaniment",
          options: ["Veg Kurma", "Dal", "Tomato Chutney", "Sambar"],
          quantityValue: "1",
          unit: "Cup"
        },
        {
          categoryName: "Vegetable (Optional)",
          options: ["Mixed Veg Salad", "Stir-fried Vegetables"],
          quantityValue: "1",
          unit: "Cup"
        }
      ]
    }
  ]
};

module.exports = masterDietChart;