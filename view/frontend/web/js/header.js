define([
	'jquery',
	'jquery/ui'
], function($) {
	'use strict';
	
	return function(config) {
		$(document).ready(function() {
			console.log('Header JS initialized'); // Debug message
			
			// Search Panel Functionality
			$('#cd-search-button, #cd-search-button-mobile').on('click', function(e) {
				e.preventDefault();
				console.log('Search button clicked'); // Debug message
				
				// Explicitly show the search panel
				$('#cd-search-panel').css('display', 'block');
				$('#cd-overlay').css('display', 'block');
				
				// Apply blur to content areas only, including breadcrumbs
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
				
				// Explicitly ensure header is NOT blurred
				$('.page-header').css('filter', 'none');
				
				// Ensure header and search panel have correct z-index
				$('.page-header, .cd-header-container').css('z-index', '1010');
				$('.cd-search-panel').css('z-index', '1005');
				
				// Focus on search input with slight delay to ensure it's visible
				setTimeout(function() {
					$('#cd-search-input').focus();
				}, 100);
			});
			
			$('#cd-search-close').on('click', function() {
				console.log('Search close clicked'); // Debug message
				
				// Hide search panel and overlay
				$('#cd-search-panel').css('display', 'none');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Mini Cart Functionality
			$('#cd-cart-trigger, #cd-cart-trigger-mobile').on('click', function(e) {
				e.preventDefault();
				$('#cd-minicart').addClass('active');
				$('#cd-overlay').css('display', 'block');
				
				// Apply blur, including breadcrumbs
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
				
				// Explicitly ensure header is NOT blurred
				$('.page-header').css('filter', 'none');
				
				// Ensure header and minicart have correct z-index
				$('.page-header, .cd-header-container').css('z-index', '1010');
				$('#cd-minicart').css('z-index', '1006');
			});
			
			$('#cd-minicart-close').on('click', function() {
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Close everything when clicking overlay
			$('#cd-overlay').on('click', function() {
				console.log('Overlay clicked'); // Debug message
				
				$('#cd-search-panel').css('display', 'none');
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Handle escape key
			$(document).keyup(function(e) {
				if (e.key === "Escape") {
					$('#cd-search-panel').css('display', 'none');
					$('#cd-minicart').removeClass('active');
					$('#cd-overlay').css('display', 'none');
					
					// Remove blur from all elements
					$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				}
			});
			
			// Update cart counter
			$(document).on('ajax:updateCartItemQty ajax:addToCart', function() {
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
				$('nav.navigation').toggle();
			});
		});
	};
});