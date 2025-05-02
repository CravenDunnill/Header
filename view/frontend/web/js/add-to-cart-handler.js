define([
	'jquery',
	'Magento_Customer/js/customer-data'
], function($, customerData) {
	'use strict';
	
	return function(config) {
		/**
		 * Function to open minicart with proper UI effects
		 */
		function openMinicart() {
			console.log('Opening minicart...');
			
			var isMobile = window.innerWidth <= 767;
			
			// Make minicart visible
			$('#cd-minicart').addClass('active');
			
			// Show overlay
			$('#cd-overlay').css('display', 'block');
			
			// Apply blur effect to content (desktop only)
			if (!isMobile) {
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
			}
			
			// Prevent body scrolling
			var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
			window.lastScrollPosition = scrollPosition;
			
			if (isMobile) {
				// Simple approach for mobile
				$('html, body').css({
					'overflow': 'hidden',
					'position': 'fixed',
					'width': '100%',
					'height': '100%'
				});
				$('body').css('top', `-${scrollPosition}px`);
			} else {
				// Full approach for desktop
				document.documentElement.classList.add('scroll-locked');
				document.body.classList.add('scroll-locked');
				document.body.style.setProperty('top', `-${scrollPosition}px`, 'important');
			}
			
			// Debug
			console.log('Minicart should now be visible');
		}
		
		/**
		 * Force refresh minicart content via AJAX
		 */
		function refreshMinicartContent() {
			$('.cd-minicart-content').addClass('loading');
			
			$.ajax({
				url: '/cravendunnill_header/cart/minicart',
				type: 'GET',
				cache: false,
				success: function(response) {
					// Update the minicart items
					$('.cd-minicart-items').html(response);
					
					// Also update subtotal
					updateSubtotal();
					
					$('.cd-minicart-content').removeClass('loading');
				},
				error: function(error) {
					console.error('Error updating minicart:', error);
					$('.cd-minicart-content').removeClass('loading');
				}
			});
		}
		
		/**
		 * Update subtotal element
		 */
		function updateSubtotal() {
			$.ajax({
				url: '/cravendunnill_header/cart/subtotal',
				type: 'GET',
				cache: false,
				success: function(response) {
					$('#cd-minicart-subtotal').html(response);
				}
			});
		}
		
		// Main initialization
		$(document).ready(function() {
			console.log('Add-to-cart handler initialized');
			
			// Detect add to cart using multiple event types for maximum compatibility
			
			// 1. Standard ajax:addToCart event
			$(document).on('ajax:addToCart', function() {
				console.log('ajax:addToCart event detected');
				customerData.reload(['cart'], true).done(function() {
					refreshMinicartContent();
					openMinicart();
				});
			});
			
			// 2. Magento's product:addToCartComplete event
			$('body').on('product:addToCartComplete', function() {
				console.log('product:addToCartComplete event detected');
				customerData.reload(['cart'], true).done(function() {
					refreshMinicartContent();
					openMinicart();
				});
			});
			
			// 3. Direct click event on add to cart buttons
			$(document).on('click', 'button.action.tocart', function() {
				console.log('Add to cart button clicked');
				// Use timeout to allow Magento's native AJAX to complete first
				setTimeout(function() {
					customerData.reload(['cart'], true).done(function() {
						refreshMinicartContent();
						openMinicart();
					});
				}, 1000);
			});
			
			// 4. Generic AJAX success detection for add to cart
			$(document).ajaxSuccess(function(event, xhr, settings) {
				if (settings.url.indexOf('checkout/cart/add') !== -1) {
					console.log('Add to cart AJAX request detected');
					customerData.reload(['cart'], true).done(function() {
						refreshMinicartContent();
						openMinicart();
					});
				}
			});
			
			// Debug check - make sure events are attached
			console.log('All add-to-cart event handlers attached');
		});
	};
});