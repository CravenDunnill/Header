define([
	'jquery',
	'jquery/ui'
], function($) {
	'use strict';
	
	return function(config) {
		$(document).ready(function() {
			// Search Panel Functionality
			$('#cd-search-button, #cd-search-button-mobile').on('click', function(e) {
				e.preventDefault();
				$('#cd-search-panel').addClass('active');
				$('#cd-overlay').addClass('active');
				$('#cd-search-input').focus();
				console.log('Search button clicked'); // For debugging
			});
			
			$('#cd-search-close').on('click', function() {
				$('#cd-search-panel').removeClass('active');
				$('#cd-overlay').removeClass('active');
			});
			
			// Mini Cart Functionality
			$('#cd-cart-trigger, #cd-cart-trigger-mobile').on('click', function(e) {
				e.preventDefault();
				$('#cd-minicart').addClass('active');
				$('#cd-overlay').addClass('active');
			});
			
			$('#cd-minicart-close').on('click', function() {
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').removeClass('active');
			});
			
			// Close everything when clicking overlay
			$('#cd-overlay').on('click', function() {
				$('#cd-search-panel').removeClass('active');
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').removeClass('active');
			});
			
			// Update cart counter
			$(document).on('ajax:updateCartItemQty ajax:addToCart', function() {
				// This will be triggered when the cart is updated
				setTimeout(function() {
					const cartItemCount = parseInt($('[data-block="minicart"]').find('.counter-number').text());
					if (cartItemCount > 0) {
						$('.cd-cart-counter').show();
					} else {
						$('.cd-cart-counter').hide();
					}
				}, 1000);
			});
			
			// Mobile menu toggle
			$('#cd-menu-button').on('click', function() {
				// This should be integrated with your mobile menu system
				// For example, trigger the Magento mobile menu if applicable
				$('nav.navigation').toggle();
			});
		});
	};
});