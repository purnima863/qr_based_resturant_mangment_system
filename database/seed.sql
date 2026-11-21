-- Sample data. Run after schema.sql:  mysql -u root -p qr_restaurant < database/seed.sql
USE qr_restaurant;

INSERT INTO categories (id,name,icon) VALUES
('pizza','Pizza','fa-pizza-slice'),
('burger','Burger','fa-burger'),
('indian','Indian Food','fa-bowl-rice'),
('snacks','Snacks','fa-cookie-bite'),
('drinks','Drinks','fa-mug-hot'),
('desserts','Desserts','fa-ice-cream');

INSERT INTO menu_items (id,category_id,name,description,price,is_veg,is_available,prep_minutes,rating,image_url) VALUES
('M01','pizza','Margherita Pizza','Classic hand-tossed base with San Marzano tomato sauce, fresh mozzarella and basil.',299,1,1,20,4.7,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=75'),
('M02','pizza','Farmhouse Pizza','Loaded with capsicum, onion, mushroom, sweet corn and juicy tomatoes.',389,1,1,22,4.6,'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=75'),
('M03','pizza','Pepperoni Feast','Generous pepperoni slices over molten mozzarella on a crisp thin crust.',449,0,1,22,4.8,'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=75'),
('M04','pizza','Paneer Tikka Pizza','Tandoori paneer cubes, onion and mint mayo on a spicy tikka base.',369,1,1,22,4.5,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=75'),
('M05','burger','Classic Veg Burger','Crunchy veggie patty, lettuce, tomato and our signature house sauce.',179,1,1,12,4.4,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=75'),
('M06','burger','Crispy Chicken Burger','Buttermilk-fried chicken, pickles and smoky mayo in a toasted brioche bun.',229,0,1,15,4.7,'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=700&q=75'),
('M07','burger','Double Cheese Burger','Two juicy patties, double melted cheddar, caramelised onions and mustard.',269,0,1,15,4.6,'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=75'),
('M08','burger','Aloo Tikki Burger','Spiced potato tikki with mint chutney, onions and cheese slice.',149,1,1,10,4.3,'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=75'),
('M09','indian','Paneer Butter Masala','Soft paneer cubes simmered in a rich, creamy tomato-butter gravy.',289,1,1,18,4.8,'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=700&q=75'),
('M10','indian','Hyderabadi Chicken Biryani','Slow-cooked basmati rice layered with marinated chicken, saffron and herbs.',349,0,1,25,4.9,'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=75'),
('M11','indian','Dal Makhani','Black lentils simmered overnight with butter and cream for a velvety finish.',239,1,1,15,4.6,'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=700&q=75'),
('M12','indian','Garlic Naan (2 pcs)','Tandoor-baked soft naan brushed with garlic butter and coriander.',89,1,1,8,4.5,'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=75'),
('M13','snacks','Peri Peri Fries','Golden fries tossed in fiery peri-peri seasoning with a cool dip.',129,1,1,8,4.4,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=75'),
('M14','snacks','Veg Spring Rolls','Crispy rolls stuffed with seasoned vegetables, served with sweet chilli sauce.',169,1,1,12,4.2,'https://images.unsplash.com/photo-1606525437679-037aca74a3e9?auto=format&fit=crop&w=700&q=75'),
('M15','snacks','Paneer Tikka','Charcoal-grilled marinated paneer with peppers, onions and mint chutney.',249,1,1,15,4.7,'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=700&q=75'),
('M16','snacks','Chilli Garlic Wings','Six crispy wings glazed in a sticky chilli-garlic sauce.',279,0,1,15,4.6,'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=700&q=75'),
('M17','drinks','Fresh Lime Soda','Zesty lime, mint and soda — sweet, salted or mixed.',89,1,1,4,4.3,'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=75'),
('M18','drinks','Mango Lassi','Thick chilled yoghurt blended with Alphonso mango pulp.',119,1,1,5,4.7,'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=700&q=75'),
('M19','drinks','Cold Coffee','Creamy iced coffee blended with vanilla ice cream and chocolate drizzle.',149,1,1,6,4.6,'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=75'),
('M20','drinks','Peach Iced Tea','Freshly brewed black tea, peach syrup and lots of ice.',129,1,1,5,4.2,'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=75'),
('M21','desserts','Chocolate Lava Cake','Warm chocolate cake with a gooey molten centre and vanilla ice cream.',169,1,1,12,4.9,'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=700&q=75'),
('M22','desserts','Gulab Jamun (2 pcs)','Soft khoya dumplings soaked in warm cardamom-rose syrup.',99,1,1,5,4.5,'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?auto=format&fit=crop&w=700&q=75'),
('M23','desserts','Walnut Brownie Sundae','Fudgy brownie, vanilla scoop, hot chocolate sauce and toasted walnuts.',189,1,1,8,4.7,'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=700&q=75'),
('M24','desserts','Rasmalai (2 pcs)','Spongy cottage-cheese discs in chilled saffron milk with pistachios.',129,1,0,5,4.6,'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=75');

INSERT INTO restaurant_tables (table_number,seats,area,status) VALUES
(1,2,'Indoor','Available'),
(2,2,'Indoor','Occupied'),
(3,4,'Indoor','Available'),
(4,4,'Indoor','Reserved'),
(5,4,'Indoor','Occupied'),
(6,4,'Outdoor','Available'),
(7,6,'Outdoor','Cleaning'),
(8,6,'Outdoor','Available'),
(9,2,'Outdoor','Occupied'),
(10,8,'Family','Reserved'),
(11,8,'Family','Available'),
(12,4,'VIP','Available');

INSERT INTO customers (name,phone,email) VALUES
('Aarav Sharma','9876543210','aarav1@example.com'),
('Priya Verma','9876543347','priya2@example.com'),
('Rohan Gupta','9876543484','rohan3@example.com'),
('Ananya Singh','9876543621','ananya4@example.com'),
('Vikram Yadav','9876543758','vikram5@example.com'),
('Sneha Mishra','9876543895','sneha6@example.com'),
('Karan Patel','9876544032','karan7@example.com'),
('Neha Tiwari','9876544169','neha8@example.com'),
('Aditya Pandey','9876544306','aditya9@example.com'),
('Kavya Reddy','9876544443','kavya10@example.com'),
('Rahul Mehta','9876544580','rahul11@example.com'),
('Isha Kapoor','9876544717','isha12@example.com');

-- Admin user is created by the backend (bcrypt hash), not here.
