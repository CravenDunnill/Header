define([
	'jquery',
	'Magento_Customer/js/customer-data',
	'mage/url',
	'domReady!'
], function($, customerData, url) {
	'use strict';
	
	// Immediately execute - don't wait for initialization
	console.log('[CD] Add to cart override loaded');
	
	// Direct forceful override of Magento's core add-to-cart functionality
	$(document).ready(function() {
		console.log('[CD] Document ready - applying cart overrides');
		
		// 1. Direct, aggressive override of add-to-cart submit
		$(document).on('submit', 'form[data-role="tocart-form"]', function(e) {
			console.log('[CD] Add to cart form submitted');
			
			// Save a reference to the form
			var form = $(this);
			
			// Allow the default form submission to proceed, but intercept after
			setTimeout(function() {
				console.log('[CD] Triggering minicart open after form submission');
				forceOpenMinicart();
			}, 1000);
		});
		
		// 2. Direct click handler for the add to cart button
		$(document).on('click', 'button.tocart', function(e) {
			console.log('[CD] Add to cart button clicked');
			
			// Let the default click event happen, but then force the minicart open
			setTimeout(function() {
				console.log('[CD] Triggering minicart open after button click');
				forceOpenMinicart();
			}, 1000);
		});
		
		// 3. Global AJAX interception
		$(document).ajaxComplete(function(event, xhr, settings) {
			// If this was an add-to-cart request
			if (settings.url.indexOf('checkout/cart/add') > -1) {
				console.log('[CD] Detected add-to-cart AJAX completion');
				forceOpenMinicart();
			}
		});
		
		// Override the add-to-cart action in the catalog-add-to-cart.js
		if (window.catalogAddToCart) {
			console.log('[CD] Found catalogAddToCart - overriding success method');
			var originalSuccess = window.catalogAddToCart.prototype.success;
			
			window.catalogAddToCart.prototype.success = function(response) {
				console.log('[CD] Intercepted catalogAddToCart success call');
				// Call original method
				originalSuccess.call(this, response);
				
				// Then force open the minicart
				setTimeout(forceOpenMinicart, 500);
			};
		} else {
			console.log('[CD] catalogAddToCart not found - will attempt alternative hooks');
			
			// Wait for it to be defined and then override
			var checkInterval = setInterval(function() {
				if (window.catalogAddToCart) {
					console.log('[CD] catalogAddToCart found after interval - overriding success method');
					var originalSuccess = window.catalogAddToCart.prototype.success;
					
					window.catalogAddToCart.prototype.success = function(response) {
						console.log('[CD] Intercepted catalogAddToCart success call');
						// Call original method
						originalSuccess.call(this, response);
						
						// Then force open the minicart
						setTimeout(forceOpenMinicart, 500);
					};
					
					clearInterval(checkInterval);
				}
			}, 100);
		}
	});
	
	// Global function to force open the minicart
	window.forceOpenMinicart = function() {
		console.log('[CD] Executing forceOpenMinicart function');
		
		// Refresh cart data from server first
		customerData.reload(['cart'], true).done(function() {
			console.log('[CD] Cart data reloaded, opening minicart...');
			
			// Forcefully apply all the effects
			$('#cd-minicart').addClass('active');
			$('#cd-overlay').css('display', 'block');
			$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
			
			// Prevent body scrolling
			var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
			window.lastScrollPosition = scrollPosition;
			document.documentElement.classList.add('scroll-locked');
			document.body.classList.add('scroll-locked');
			document.body.style.setProperty('top', `-${scrollPosition}px`, 'important');
			
			// Update minicart content
			refreshMinicartContent();
		});
	};
	
	// Function to refresh minicart content
	function refreshMinicartContent() {
		console.log('[CD] Refreshing minicart content');
		$('.cd-minicart-content').addClass('loading');
		
		$.ajax({
			url: url.build('cravendunnill_header/cart/minicart'),
			type: 'GET',
			cache: false,
			success: function(response) {
				console.log('[CD] Minicart content loaded successfully');
				$('.cd-minicart-items').html(response);
				$('.cd-minicart-content').removeClass('loading');
				updateSubtotal();
			},
			error: function(error) {
				console.error('[CD] Error refreshing minicart content:', error);
				$('.cd-minicart-content').removeClass('loading');
			}
		});
	}
	
	// Function to update subtotal
	function updateSubtotal() {
		$.ajax({
			url: url.build('cravendunnill_header/cart/subtotal'),
			type: 'GET',
			cache: false,
			success: function(response) {
				$('#cd-minicart-subtotal').html(response);
			}
		});
	}
	
	// Add global event listener for custom events
	$(document).on('product:added', function() {
		console.log('[CD] Custom product:added event detected');
		forceOpenMinicart();
	});
	
	return function() {
		console.log('[CD] Add-to-cart override component initialized');
		
		// Expose the forceOpenMinicart function globally
		window.forceOpenMinicart = forceOpenMinicart;
		
		// Add a button to manually trigger the cart open (for debugging)
		if (window.location.search.indexOf('debug=1') !== -1) {
			$('body').append(
				'<button id="force-open-cart" style="position:fixed;bottom:10px;right:10px;z-index:9999;">'+
				'Force Open Cart</button>'
			);
			
			$('#force-open-cart').on('click', function() {
				forceOpenMinicart();
			});
		}
	};
});