define([
	'jquery',
	'ko',
	'uiComponent',
	'Magento_Customer/js/customer-data',
	'Magento_Catalog/js/price-utils',
	'Magento_Ui/js/modal/modal',
	'mage/translate'
], function ($, ko, Component, customerData, priceUtils, modal, $t) {
	'use strict';

	// Debug - make customer data accessible globally for debugging
	window.customerData = customerData;

	return Component.extend({
		defaults: {
			template: 'CravenDunnill_Header::ko/checkout/minicart.phtml',
			activeMinicart: ko.observable(false),
			cartItems: ko.observableArray([]),
			cartData: {},
			maxItemsToDisplay: 10
		},

		/**
		 * @override
		 */
		initialize: function () {
			var self = this;
			this._super();
			
			// Subscribe to cart data changes
			this.cart = customerData.get('cart');
			this.cart.subscribe(function (updatedCart) {
				console.log('Cart updated:', updatedCart);
				self.cartData = updatedCart;
				self.cartItems(self.getCartItems());
				
				// Update cart counter
				if (updatedCart && updatedCart.summary_count) {
					$('.cd-cart-counter').show();
					$('.cd-cart-counter').addClass('updated');
					setTimeout(function() {
						$('.cd-cart-counter').removeClass('updated');
					}, 500);
				} else {
					$('.cd-cart-counter').hide();
				}
			});
			
			// Set initial cart data
			this.cartData = customerData.get('cart')();
			console.log('Initial cart data:', this.cartData);
			
			// Register closeMinicart function
			this.closeMinicart = function() {
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').hide();
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				
				// Allow scrolling
				document.documentElement.classList.remove('scroll-locked');
				document.body.classList.remove('scroll-locked');
				document.body.style.removeProperty('overflow');
				document.body.style.removeProperty('position');
				document.body.style.removeProperty('height');
				document.body.style.removeProperty('width');
				document.body.style.removeProperty('top');
				
				// Restore scroll position
				const scrollPosition = window.lastScrollPosition || 0;
				window.scrollTo(0, scrollPosition);
			};
			
			// Add document click handler to close minicart when clicking outside
			$(document).on('click', function(e) {
				// Check if minicart is active
				if ($('#cd-minicart').hasClass('active')) {
					// Check if click is outside the minicart
					if (!$(e.target).closest('#cd-minicart').length && 
						!$(e.target).closest('#cd-cart-trigger').length && 
						!$(e.target).closest('#cd-cart-trigger-mobile').length) {
						
						// Call our close function
						self.closeMinicart();
					}
				}
			});
			
			return this;
		},

		/**
		 * @returns {Array}
		 */
		getCartItems: function() {
			var items = [];
			if (this.cartData && this.cartData.items && this.cartData.items.length) {
				console.log('Cart has items:', this.cartData.items.length);
				items = this.cartData.items;
				
				// Debug - log each item
				items.forEach(function(item, index) {
					console.log('Item ' + index + ':', item);
					console.log('  - price:', item.product_price);
					console.log('  - image:', item.product_image);
				});
			} else {
				console.log('No items in cart data');
			}
			return items;
		},

		/**
		 * Get cart param by name
		 * @param {String} name
		 * @returns {*}
		 */
		getCartParam: function (name) {
			if (!this.cartData) {
				return null;
			}
			
			return this.cartData[name];
		},

		/**
		 * Get cart param HTML by name
		 * @param {String} name
		 * @returns {*}
		 */
		getCartParamUnsanitizedHtml: function (name) {
			if (!this.cartData) {
				return '';
			}
			
			return this.cartData[name];
		},

		/**
		 * Get the cart line items count
		 * @returns {Number}
		 */
		getCartLineItemsCount: function () {
			var items = this.getCartItems();
			return items.length;
		},

		/**
		 * Get the item renderer template
		 * @returns {String}
		 */
		getItemRenderer: function () {
			return 'CravenDunnill_Header::ko/checkout/cart/item/default.phtml';
		},
		
		/**
		 * Get product image data
		 * @param {Object} item
		 * @returns {Object}
		 */
		getItemProductImageData: function(item) {
			var imageData = {
				src: '',
				alt: item.product_name || '',
				width: 75,
				height: 94
			};
			
			if (item.product_image) {
				// If product_image is a string URL
				if (typeof item.product_image === 'string') {
					imageData.src = item.product_image;
				} 
				// If it's a proper object with src property
				else if (item.product_image.src) {
					imageData.src = item.product_image.src;
					if (item.product_image.alt) {
						imageData.alt = item.product_image.alt;
					}
					if (item.product_image.width) {
						imageData.width = item.product_image.width;
					}
					if (item.product_image.height) {
						imageData.height = item.product_image.height;
					}
				}
			}
			
			console.log('Image data for item:', imageData);
			return imageData;
		}
	});
});