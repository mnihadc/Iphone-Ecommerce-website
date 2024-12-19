const chatbox = document.getElementById("chat");
const scrollButton = document.getElementById("scrollButton");

// Function to scroll to the bottom of the chat
function scrollToBottom() {
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Show/hide scroll-to-bottom button
chatbox.addEventListener("scroll", () => {
  scrollButton.style.display =
    chatbox.scrollTop < chatbox.scrollHeight - chatbox.offsetHeight - 50
      ? "block"
      : "none";
});

// Predefined bot responses
const botReplies = {
  // Basic greetings
  hi: "Hi! How can I assist you today?",
  hello: "Hello! Welcome to iStore. How can I help you?",
  hey: "Hey there! Let me know how I can assist you.",

  // Delivery-related questions
  "how long does delivery take": "Our delivery takes up to 7 days.",
  "delivery time": "Your order will be delivered within 7 days.",
  "can i get faster delivery":
    "Currently, we only offer standard delivery within 7 days.",
  "do you deliver internationally":
    "No, we currently deliver only within India.",
  "where do you ship": "We ship all over India.",

  // Return and refund policies
  "return policy":
    "You can return the product within 15 days of delivery if it's unopened and in its original condition.",
  "exchange policy":
    "We offer exchanges for defective products within 15 days. Please contact our support team for assistance.",
  refund:
    "Refunds are processed within 7–10 working days once the returned product is verified.",
  "what is the return window":
    "Our return window is 15 days from the date of delivery.",
  "how do i return a product":
    "To return a product, contact our support team for assistance. Ensure the product is unopened and in its original packaging.",

  // Payment-related questions
  "how can i pay":
    "We accept payments via credit/debit cards, net banking, and UPI.",
  "is cash on delivery available":
    "Currently, we do not offer cash on delivery. Please choose from our online payment options.",
  "what payment methods do you accept":
    "We accept payments via credit cards, debit cards, net banking, and UPI.",
  "is emi available":
    "Yes, we offer EMI options for credit card payments. Details are available at checkout.",
  "is my payment secure":
    "Yes, all payments on our platform are encrypted and secure.",

  // Product-related questions
  "do you sell iphone":
    "Yes, we sell iPhones in various models. Please explore our shop page for more details.",
  "do you sell iphone 15":
    "Yes, we sell iPhone 15. Please visit our shop page to explore its specifications and pricing.",
  iphone:
    "We offer a wide range of iPhones. Visit our shop page to view all models, descriptions, and specifications.",
  "do you sell macbook":
    "Yes, we offer MacBooks in different configurations. Visit our shop page for more details.",
  macbook:
    "We sell various MacBook models. Check out our shop page for more details.",
  "do you sell ipad":
    "Yes, we sell iPads. Explore the shop page to find the perfect iPad for your needs.",
  ipad: "We offer different iPad models. Explore our shop page for the right one for you.",
  "do you sell apple watch":
    "Yes, we have a wide range of Apple Watches. Check out our shop page for more information.",
  "apple watch":
    "We have a variety of Apple Watch models available. Check our shop page for options.",
  "do you sell airpods":
    "Yes, we sell AirPods, including AirPods Pro and AirPods Max. Visit the shop page to learn more.",
  airpods:
    "Yes, we sell AirPods, including the Pro and Max versions. Visit the shop page for more details.",
  "do you sell apple tv":
    "Yes, we sell Apple TV devices. Visit our shop page to learn more about the models and features.",
  "apple tv":
    "We sell Apple TV devices. Check the shop page for specifications and features.",
  "do you sell imac":
    "Yes, we sell iMacs. Explore our shop page for specifications and details.",
  imac: "Yes, we sell iMacs. Visit our shop page for configurations and pricing.",
  "do you sell mac mini":
    "Yes, we sell Mac Mini. Visit our shop page to explore configurations and pricing.",
  "mac mini": "We sell Mac Mini devices. Explore our shop page for details.",
  "do you sell accessories":
    "Yes, we sell Apple accessories, including chargers, cables, cases, and more. Check the shop page for details.",
  accessories:
    "We sell a variety of Apple accessories. Check out our shop page to explore.",
  "do you sell refurbished products":
    "No, we only sell brand-new Apple products.",
  "are all products genuine": "Yes, we sell only genuine Apple products.",
  "do you sell covers for iphone":
    "Yes, we sell covers for various iPhone models. Check the Accessories section in our shop page.",

  // Order tracking
  "can i track my order":
    "Yes, you can track your order using the tracking ID sent to your email after purchase.",
  "how do i check my order status":
    "Log in to your account and visit the 'My Orders' section to check your order status.",
  "can i change my address after ordering":
    "You can request a change before your order is shipped by contacting our support team.",

  // Support and contact
  "how to contact support":
    "You can contact our support team via the Contact Us page on our website.",
  "how do i contact support":
    "You can contact us via the 'Contact Us' page on our website.",
  "what are your working hours":
    "Our online store is available 24/7. For support, our working hours are 9 AM to 6 PM IST.",

  "can i place an order online":
    "Yes, you can place an order directly on our website.",
  "how can i place an order":
    "You can place an order by browsing our products, adding them to your cart, and proceeding to checkout.",
  "how do i order on your website":
    "Simply add items to your cart and proceed to checkout for easy ordering.",
  "can i order by phone":
    "Currently, we only accept online orders through our website.",
  "how do i check out":
    "After selecting your items, click on the cart icon and proceed to checkout.",
  "do you offer any discounts for bulk orders":
    "For bulk orders, please contact our sales team for special pricing.",
  "can i order more than one item at a time":
    "Yes, you can add multiple items to your cart and proceed to checkout.",
  "do you offer free delivery":
    "Yes, we offer free delivery for orders above ₹5000.",
  "is there a minimum order value for delivery":
    "There is no minimum order value, but free delivery is available for orders above ₹5000.",
  "is it safe to shop online":
    "Yes, shopping on our site is secure with encrypted payment processing.",

  // Product-related questions
  "do you sell refurbished iphones":
    "No, we only sell brand-new Apple products.",
  "how do i know if a product is in stock":
    "Stock availability is shown on each product page.",
  "do you have iPhone 14 in stock":
    "Yes, iPhone 14 is available. Please visit our shop page for more details.",
  "is there a warranty on macbooks":
    "Yes, all MacBooks come with a one-year warranty from Apple.",
  "how much storage does the macbook pro have":
    "The MacBook Pro comes in various storage options ranging from 256GB to 2TB.",
  "does the ipad come with a stylus":
    "No, the stylus (Apple Pencil) is sold separately.",
  "is the iPhone 13 waterproof":
    "The iPhone 13 is rated IP68, meaning it is resistant to water and dust.",
  "what colors does the macbook air come in":
    "The MacBook Air is available in Space Gray, Gold, and Silver.",
  "can i upgrade the storage of my macbook":
    "No, the storage is not upgradeable after purchase. Please select the desired storage option when buying.",
  "can i install windows on macbook":
    "Yes, you can install Windows on a MacBook using Boot Camp or a virtual machine.",

  // Payment and pricing questions
  "what payment methods are accepted":
    "We accept payments via credit/debit cards, UPI, and net banking.",
  "is cash on delivery available":
    "Currently, we do not offer cash on delivery. Only online payments are accepted.",
  "can i pay with my Paytm wallet":
    "We do not accept Paytm, but UPI payments are available.",
  "is emi available for iphone":
    "Yes, EMI options are available on iPhones for credit card payments.",
  "can i pay through google pay": "Yes, we accept payments via Google Pay.",
  "is there a service charge for emi":
    "EMI options may have an interest charge, depending on the card issuer.",
  "can i pay in installments":
    "Yes, EMI options are available for credit card payments during checkout.",
  "can i use a gift card to pay for my order":
    "Yes, you can use gift cards to pay for your order.",
  "do you offer discounts for students":
    "Currently, we do not offer student discounts, but keep an eye on our sales.",
  "is there any discount on bulk orders":
    "For bulk orders, please contact our sales team for special pricing.",

  // Delivery and shipping-related questions
  "how long does delivery take":
    "Delivery takes up to 7 days depending on your location.",
  "do you ship internationally": "We currently ship only within India.",
  "how do i track my order":
    "You can track your order using the tracking ID sent to your email after purchase.",
  "can i change my delivery address after ordering":
    "You can change your delivery address before the order is shipped by contacting support.",
  "is there any shipping fee":
    "We offer free delivery for orders above ₹5000, otherwise a ₹200 shipping fee applies.",
  "how do i get my delivery confirmation":
    "You will receive a confirmation email once your order is shipped, along with the tracking details.",
  "can i select my delivery time":
    "Currently, we do not allow specific delivery time selections, but you can track your order status online.",
  "do you ship to my location":
    "We deliver to all locations within India. Check our delivery area before ordering.",
  "is there express shipping available":
    "Currently, we only offer standard shipping within 7 days.",
  "can i get a discount on shipping":
    "We do not offer discounts on shipping. However, shipping is free for orders above ₹5000.",

  // Returns and refunds
  "what is your return policy":
    "You can return an item within 15 days if it is unopened and in its original condition.",
  "how do i return a product":
    "Contact our support team to request a return within 15 days of receiving the item.",
  "can i get a refund for a returned product":
    "Yes, we process refunds within 7–10 working days once the product is verified.",
  "how long do i have to return a product":
    "You have 15 days from the delivery date to return an item.",
  "can i exchange a product":
    "We offer exchanges for defective products within 15 days of purchase.",
  "do you offer a refund on sale items":
    "Yes, if the sale item is unopened and in its original condition, you can return it for a refund.",
  "is there a restocking fee for returns":
    "No, we do not charge a restocking fee for returns.",
  "how do i exchange a product":
    "To exchange a product, please contact our support team and follow the steps.",
  "can i return a product if it is used":
    "No, products must be unopened and unused to be eligible for return.",
  "how do i cancel an order":
    "You can cancel an order before it is shipped by contacting our support team.",

  // Customer support and contact questions
  "how do i contact customer support":
    "You can contact us through the 'Contact Us' page on our website.",
  "what are your customer service hours":
    "Our customer service is available from 9 AM to 6 PM IST.",
  "is there a live chat option":
    "Yes, you can chat with us using the live chat feature on our website.",
  "can i contact support via phone":
    "Currently, support is available only via email or chat.",
  "how can i cancel my order":
    "You can cancel your order before it ships by contacting customer support.",
  "how can i ask a question about a product":
    "You can ask questions directly on the product page, or use the contact us form.",
  "do you have a support phone number":
    "We do not have a support phone number. Please contact us via email or the chat option.",
  "how do i report a problem with my order":
    "Please contact our customer support team with your order details and issue.",
  "how do i submit a product review":
    "You can submit a review on the product page after making a purchase.",
  "what should i do if my order is missing items":
    "Please contact support immediately and provide your order details.",

  // Warranty and repair
  "what is the warranty on apple products":
    "All Apple products come with a standard one-year warranty.",
  "how do i claim my warranty":
    "To claim a warranty, please contact our support team with your proof of purchase.",
  "is warranty available on refurbished products":
    "We do not sell refurbished products, but all our new products come with a one-year warranty.",
  "how long does warranty coverage last":
    "Apple products come with a one-year warranty. Extended coverage is available through AppleCare.",
  "does the iphone come with a warranty":
    "Yes, iPhones come with a one-year warranty from Apple.",
  "how do i get my macbook repaired":
    "Contact our support team for repair instructions and service center locations.",
  "does the ipad come with a warranty":
    "Yes, iPads are covered by a one-year warranty from Apple.",
  "is there extended warranty available":
    "Yes, you can purchase AppleCare for extended warranty and support.",
  "how can i check if my product is under warranty":
    "You can check warranty status on the Apple website with your serial number.",
  "do you provide repair services":
    "We do not provide repair services, but we can assist you with warranty claims and Apple support.",

  // General questions
  "is my personal information safe":
    "Yes, your personal data is secure with us. We follow strict privacy guidelines.",
  "do you offer installation services":
    "Installation is available for select Apple devices. Please contact support for assistance.",
  "do you sell phone cases":
    "Yes, we sell phone cases for various iPhone models.",
  "are your products genuine":
    "Yes, we sell only genuine, brand-new Apple products.",
  "do you sell apple accessories":
    "Yes, we offer a variety of Apple accessories, including chargers, cables, and cases.",
  "can i return a product after 15 days":
    "Returns are only accepted within 15 days of delivery.",
  "what if my product is damaged during shipping":
    "If your product is damaged during shipping, please contact us within 48 hours to request a replacement.",
  "do you offer gift cards":
    "Yes, we offer gift cards, which can be used to purchase products on our site.",
  "do you offer a loyalty program":
    "Currently, we do not have a loyalty program, but we offer occasional sales and promotions.",
  "is my payment secure on your website":
    "Yes, all payments are encrypted and processed securely.",

  // General questions
  warranty: "All our Apple products come with a standard one-year warranty.",
  "is pickup available": "No, we only offer home delivery for all orders.",
  "do you provide installation":
    "Installation support is available for Apple devices like iMacs. Contact our support team for help.",
  "is my personal data safe":
    "Yes, your personal data is safe with us. We follow strict data privacy guidelines.",
  "can i cancel my order":
    "You can cancel your order before it is shipped by contacting our support team.",
  "how to cancel my order":
    "You can cancel your order before it is shipped by contacting our support team.",
  "what is the difference between iphone 13 and iphone 14":
    "The iPhone 14 has a better camera, enhanced performance, and a larger battery compared to the iPhone 13.",
  "does the iphone 12 support 5g":
    "Yes, iPhone 12 supports 5G for faster network speeds.",
  "does the iphone 13 have a better camera than the iphone 12":
    "Yes, the iPhone 13 features improvements in low-light performance and video recording compared to the iPhone 12.",
  "is the iphone 12 waterproof":
    "Yes, the iPhone 12 has an IP68 water and dust resistance rating.",
  "what colors does the iphone 14 come in":
    "The iPhone 14 comes in purple, blue, midnight, starlight, and red.",
  "what is the storage capacity of iphone 14":
    "The iPhone 14 comes in storage options of 128GB, 256GB, and 512GB.",
  "does iphone 13 support wireless charging":
    "Yes, iPhone 13 supports MagSafe wireless charging up to 15W.",
  "is the iphone 13 battery better than the iphone 12":
    "Yes, the iPhone 13 has a larger battery that offers longer battery life compared to the iPhone 12.",
  "does the iphone 13 have a 120hz display":
    "No, the iPhone 13 features a 60Hz display. The 120Hz display is available on iPhone 13 Pro models.",
  "does the iphone 12 have night mode":
    "Yes, the iPhone 12 has Night Mode on both the front and rear cameras.",

  // Return and Refund
  "can i return a product if it is opened":
    "We only accept returns for unopened products in their original condition.",
  "how do i know if my return is processed":
    "You will receive an email confirmation once your return is processed and a refund is initiated.",
  "can i return a product after using it for a few days":
    "We cannot accept returns for used products unless defective or damaged.",
  "can i return a product in any condition":
    "The product must be unopened and in its original packaging for returns.",
  "is there any fee for returning a product":
    "No, there is no fee for returns if the product is in its original condition and within the return window.",
  "can i exchange a product if i don’t like it":
    "Exchanges are available for defective or damaged products only. If you're unhappy with the product, contact support for assistance.",
  "how long does it take to process a return":
    "Returns are processed within 7-10 business days after we receive the item.",
  "can i exchange a product for a different model":
    "Exchanges are only available for defective products. Please contact support for further assistance.",
  "can i exchange a product without a receipt":
    "We require a receipt or proof of purchase for exchanges or returns.",
  "how can i check if my return is eligible":
    "Please refer to our return policy or contact our customer support for clarification on eligibility.",

  // Delivery
  "can i select the delivery courier":
    "Currently, we do not offer a choice of delivery couriers. We use the most reliable options available.",
  "how do i know when my order will arrive":
    "You will receive an email with a tracking ID once your order has shipped.",
  "can i get a specific delivery date":
    "We do not allow specific delivery date selection, but you can track your package once it ships.",
  "is delivery available on weekends":
    "Yes, delivery is available on weekends, depending on the courier.",
  "how do i know if my order has been shipped":
    "You will receive a shipping confirmation email once your order is shipped, including tracking details.",
  "can my delivery be delayed due to holidays":
    "Yes, deliveries may be delayed during national holidays. We will notify you of any shipping delays.",
  "is same-day delivery available":
    "Currently, we do not offer same-day delivery. Standard delivery takes up to 7 days.",
  "can i cancel my delivery":
    "You can cancel your order before it ships by contacting our support team.",
  "is delivery free for international orders":
    "We currently offer free delivery only for domestic orders above ₹5000. For international orders, shipping charges apply.",
  "can i change my shipping address after placing an order":
    "You can change the shipping address before the order ships by contacting our support team.",

  // Payment
  "can i pay using a debit card":
    "Yes, we accept payments via debit card, credit card, and UPI.",
  "do you accept net banking": "Yes, we accept net banking for payments.",
  "is there an additional charge for emi":
    "EMI options may have additional interest charges, depending on the card issuer.",
  "is there a payment option for senior citizens":
    "Currently, we do not have a specific payment option for senior citizens.",
  "can i pay in installments for my macbook":
    "Yes, you can pay for your MacBook in installments using EMI options available at checkout.",
  "do you accept payment via Amazon Pay":
    "Currently, we do not accept Amazon Pay. We accept payments via credit/debit cards, UPI, and net banking.",
  "is my payment information safe":
    "Yes, we use encrypted payment gateways to ensure your payment information is secure.",
  "can i pay using cryptocurrency":
    "Currently, we do not accept cryptocurrency as a payment method.",
  "can i use my mobile wallet to pay":
    "Yes, we accept payments via UPI-based mobile wallets.",
  "do you charge extra for credit card payments":
    "We do not charge extra fees for credit card payments.",

  // Warranty
  "how long is the warranty on the macbook pro":
    "The MacBook Pro comes with a one-year warranty from Apple, which can be extended with AppleCare.",
  "does the ipad come with a warranty":
    "Yes, the iPad comes with a standard one-year warranty.",
  "can i buy extended warranty for iphone":
    "Yes, you can purchase AppleCare to extend your warranty and get additional coverage.",
  "what does the apple warranty cover":
    "The Apple warranty covers manufacturing defects and hardware malfunctions under normal use.",
  "is the iphone 13 warranty international":
    "Yes, Apple’s warranty is valid internationally for most repairs and services.",
  "does the apple watch come with a warranty":
    "Yes, the Apple Watch comes with a one-year warranty from Apple.",
  "how do i claim my warranty for a defective product":
    "To claim your warranty, please contact our customer support with your purchase details, and we'll assist you further.",
  "does apple provide repair services for products under warranty":
    "Yes, Apple provides repair services for products under warranty, subject to their terms and conditions.",
  "is there a warranty on accessories":
    "Yes, Apple accessories also come with a one-year warranty.",
  "can i return a product after the warranty expires":
    "Returns are accepted within the return window (15 days). After that, only warranty claims are applicable for defective products.",

  // Product Availability
  "is the macbook air available":
    "Yes, we have the MacBook Air available in various configurations. Please check the product page for more details.",
  "do you have the iphone 13 mini":
    "Yes, we have the iPhone 13 mini in stock. Check the shop page for availability and pricing.",
  "is the ipad pro available in 1TB storage":
    "Yes, the iPad Pro is available in 1TB storage. Visit our shop page for more details.",
  "when will the iphone 15 be available":
    "The iPhone 15 is available now. Please check our shop page for pricing and availability.",
  "does the iphone 14 support 5g":
    "Yes, the iPhone 14 supports 5G for faster connectivity.",
  "is the macbook pro 16-inch available":
    "Yes, the MacBook Pro 16-inch is available in various configurations. Visit our shop page for more information.",
  "can i pre-order the iphone 14":
    "Pre-orders for the iPhone 14 are no longer available. However, you can buy it directly from our shop page.",
  "do you sell the iphone 12 mini":
    "Yes, we sell the iPhone 12 mini. Please check the product page for more details.",
  "do you have airpods pro 2nd generation":
    "Yes, the AirPods Pro (2nd generation) is available. Visit our shop page for more information.",
  "can i order a custom macbook":
    "Currently, we only sell standard configurations. For custom builds, you may need to order directly from Apple’s website.",

  // Customer Service
  "how do i contact customer service":
    "You can contact customer service through the 'Contact Us' page on our website.",
  "do you offer live chat support":
    "Yes, we offer live chat support on our website. You can reach out to us for immediate assistance.",
  "what is the support phone number":
    "Currently, we do not offer phone support. Please contact us via email or live chat.",
  "how can i resolve an issue with my order":
    "Please contact our customer support team, and we’ll help resolve any issues with your order.",
  "how do i track my support ticket":
    "You will receive email updates about your support ticket. Please refer to the ticket ID in your emails.",
  "can i contact customer support via email":
    "Yes, you can contact customer support at support@yourstore.com.",
  "how do i cancel a support request":
    "You can cancel a support request by contacting our customer service team through email or chat.",
  "do you have a support FAQ section":
    "Yes, our FAQ section provides answers to common queries. You can check it on our website.",
  "can i get help with installation":
    "Yes, we provide installation assistance for Apple devices. Please contact our support team for details.",
  "what is the best way to contact customer service":
    "The best way to contact customer service is through our live chat or email for immediate assistance.",

  // Privacy & Security
  "is my personal information safe with you":
    "Yes, your personal data is secure. We follow strict data privacy policies to protect your information.",
  "do you share my personal data with third parties":
    "We do not share your personal data with third parties, except for necessary shipping or payment processing purposes.",
  "is your website secure":
    "Yes, our website uses encryption to protect your data during online transactions.",
  "do you use cookies on your website":
    "Yes, we use cookies to improve your browsing experience. By using our site, you agree to our cookie policy.",
  "how do i delete my account":
    "To delete your account, please contact our support team with your request.",
  "how do i change my email address":
    "You can change your email address by updating your account settings or contacting our customer support.",
  "how do i update my personal details":
    "To update your personal details, log in to your account and edit your information.",
  "do you collect sensitive personal information":
    "We only collect necessary personal information such as your name, email, and shipping address to process orders.",
  "is my payment information safe":
    "Yes, we use secure payment gateways to ensure that your payment information is encrypted and safe.",
  "how do i reset my password":
    "To reset your password, click on 'Forgot Password' on the login page and follow the instructions.",
  // Default response
  default: "Sorry, I didn't understand that. Could you please rephrase?",
};

// Function to send a message
function sendMessage() {
  const userMessage = document.getElementById("userInput").value.trim();

  if (!userMessage) return;

  // Display user message
  const userDiv = document.createElement("div");
  userDiv.className = "message user";
  userDiv.textContent = userMessage;
  chatbox.appendChild(userDiv);

  // Clear input
  document.getElementById("userInput").value = "";

  // Get bot reply
  const lowerCaseMessage = userMessage.toLowerCase();
  const botReply =
    botReplies[
      Object.keys(botReplies).find((key) => lowerCaseMessage.includes(key)) ||
        "default"
    ];

  // Display bot reply
  const botDiv = document.createElement("div");
  botDiv.className = "message bot";
  botDiv.textContent = botReply;
  chatbox.appendChild(botDiv);

  // Scroll to the bottom
  scrollToBottom();
}
