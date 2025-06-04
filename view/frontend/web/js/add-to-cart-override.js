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
		
		// 2. Handle tile sample forms specifically
		$(document).on('submit', 'form[data-role="tile-sample-form"]', function(e) {
			console.log('[CD] Tile sample form submitted');
			
			// Don't interfere with the tile sample handler
			// Just set up a fallback timeout
			setTimeout(function() {
				console.log('[CD] Fallback: Opening minicart after tile sample form');
				forceOpenMinicart();
			}, 2000);
		});
		
		// 3. Direct click handler for the add to cart button
		$(document).on('click', 'button.tocart', function(e) {
			console.log('[CD] Add to cart button clicked');
			
			// Let the default click event happen, but then force the minicart open
			setTimeout(function() {
				console.log('[CD] Triggering minicart open after button click');
				forceOpenMinicart();
			}, 1000);
		});
		
		// 4. Handle tile sample buttons specifically
		$(document).on('click', '.tile-sample-button:not(.tile-sample-button-disabled)', function(e) {
			console.log('[CD] Tile sample button clicked');
			
			// Don't interfere with the tile sample handler
			// Just set up a fallback timeout
			setTimeout(function() {
				console.log('[CD] Fallback: Opening minicart after tile sample button');
				forceOpenMinicart();
			}, 2000);
		});
		
		// 5. Global AJAX interception
		$(document).ajaxComplete(function(event, xhr, settings) {
			// If this was an add-to-cart request
			if (settings.url.indexOf('checkout/cart/add') > -1 || settings.url.indexOf('tilesample/cart/add') > -1) {
				console.log('[CD] Detected add-to-cart AJAX completion for URL:', settings.url);
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
		
		var isMobile = window.innerWidth <= 767;
		
		// Refresh cart data from server first
		customerData.reload(['cart'], true).done(function() {
			console.log('[CD] Cart data reloaded, opening minicart...');
			
			// Ensure minicart is positioned correctly
			ensureMinicartPosition();
			
			// Forcefully apply all the effects
			$('#cd-minicart').addClass('active');
			$('#cd-overlay').css('display', 'block');
			
			// Only apply blur on desktop
			if (!isMobile) {
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
			}
			
			// Prevent body scrolling - simplified for mobile
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
			
			// Ensure minicart is positioned correctly at the top of viewport
			$('#cd-minicart').css('top', '0');
			
			// Update minicart content
			refreshMinicartContent();
		});
	};
	
	// Function to ensure minicart is positioned correctly
	function ensureMinicartPosition() {
		var $minicart = $('#cd-minicart');
		
		if ($minicart.length) {
			// Make sure it's at body level
			if (!$minicart.parent().is('body')) {
				console.log('[CD] Moving minicart to body level');
				$minicart.detach().appendTo('body');
			}
			
			// Ensure proper styling
			$minicart.css({
				'position': 'fixed',
				'top': '0',
				'z-index': '9999',
				'height': '100vh'
			});
			
			if (window.innerWidth <= 767) {
				$minicart.css({
					'width': '100%',
					'max-width': '100%',
					'right': '-100%'
				});
			} else {
				$minicart.css({
					'width': '400px',
					'max-width': '90%',
					'right': '-450px'
				});
			}
		}
	}
	
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
	
	// Add specific listener for tile sample events
	$(document).on('tile-sample:added', function() {
		console.log('[CD] Tile sample added event detected');
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