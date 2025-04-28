define([
	'jquery',
	'Magento_Customer/js/customer-data'
], function($, customerData) {
	'use strict';
	
	return function(config) {
		// Function to update cart counter display
		function updateCartCounter() {
			var cartData = customerData.get('cart')();
			if (cartData && cartData.summary_count > 0) {
				$('.cd-cart-counter').text(cartData.summary_count).show();
				
				// Add animation class
				$('.cd-cart-counter').addClass('updated');
				
				// Remove class after animation completes
				setTimeout(function() {
					$('.cd-cart-counter').removeClass('updated');
				}, 500);
			} else {
				$('.cd-cart-counter').hide();
			}
		}
		
		// Function to open minicart
		function openMinicart() {
			$('#cd-minicart').addClass('active');
			$('#cd-overlay').css('display', 'block');
			$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
			
			// Prevent body scrolling
			var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
			window.lastScrollPosition = scrollPosition;
			document.documentElement.classList.add('scroll-locked');
			document.body.classList.add('scroll-locked');
			document.body.style.setProperty('top', `-${scrollPosition}px`, 'important');
			
			// Refresh minicart content via AJAX
			refreshMinicartContent();
		}
		
		// Function to refresh minicart content
		function refreshMinicartContent() {
			$.ajax({
				url: '/cravendunnill_header/cart/items',
				type: 'GET',
				dataType: 'json',
				beforeSend: function() {
					// Show loading indicator
					$('.cd-minicart-content').addClass('loading');
				},
				success: function(response) {
					// Only replace the content inside the items list
					if (response.success) {
						// Extract just the items HTML
						var tempDiv = document.createElement('div');
						tempDiv.innerHTML = response.html;
						
						// Find the items list
						var itemsList = $(tempDiv).find('.minicart-items');
						if (itemsList.length) {
							// Replace the items list
							$('.cd-minicart-items').html(itemsList.html());
						} else {
							// If no items, show empty message
							$('.cd-minicart-content').html('<div class="cd-empty-cart"><p>You have no items in your trolley.</p></div>');
						}
					}
				},
				complete: function() {
					// Remove loading indicator
					$('.cd-minicart-content').removeClass('loading');
				}
			});
		}
		
		// Initial update
		updateCartCounter();
		
		// Subscribe to cart changes
		customerData.get('cart').subscribe(function() {
			updateCartCounter();
		});
		
		// Listen for add to cart events
		$(document).on('ajax:addToCart', function() {
			console.log('Product added to cart');
			
			// Force refresh cart data
			customerData.reload(['cart'], true).done(function() {
				// Open minicart after data is updated
				openMinicart();
			});
		});
		
		// Also listen for the "product:addToCartComplete" event
		$('body').on('product:addToCartComplete', function() {
			console.log('Product add to cart complete');
			
			// Force refresh cart data
			customerData.reload(['cart'], true).done(function() {
				// Open minicart after data is updated
				openMinicart();
			});
		});
		
		// Listen for ajax success for add to cart operations
		$(document).ajaxSuccess(function(event, xhr, settings) {
			if (settings.url.indexOf('checkout/cart/add') !== -1) {
				console.log('Add to cart AJAX success detected');
				
				// Force refresh cart data
				customerData.reload(['cart'], true).done(function() {
					// Open minicart after data is updated
					openMinicart();
				});
			}
		});
		
		// Force cart data refresh
		setTimeout(function() {
			customerData.reload(['cart'], true);
		}, 1000);
	};
});