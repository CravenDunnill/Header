define([
	'jquery',
	'jquery/ui'
], function($) {
	'use strict';
	
	return function(config) {
		// Critical fix: Move the overlay to a position that won't cover the header
		function fixOverlayPosition() {
			// Move overlay to be a child of page-main instead of being at the top level
			// This ensures it only covers the content, not the header
			const $overlay = $('#cd-overlay');
			const $pageMain = $('.page-main');
			
			if ($overlay.length && $pageMain.length) {
				// Only move it if it's not already a child of page-main
				if (!$overlay.parent().is($pageMain)) {
					// Clone the overlay to preserve all event handlers
					const $newOverlay = $overlay.clone(true);
					// Remove the original
					$overlay.remove();
					// Append the clone to page-main
					$pageMain.prepend($newOverlay);
					
					// Fix the styling to make it cover only the page-main content
					$newOverlay.css({
						'position': 'absolute',
						'top': '0',
						'left': '0',
						'right': '0',
						'bottom': '0',
						'z-index': '100'
					});
				}
			}
		}
		
		// Apply before document ready for maximum effectiveness
		fixOverlayPosition();
		
		// Execute immediately - don't wait for document ready
		// Apply no-blur class to header elements
		$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').addClass('no-blur');
		
		$(document).ready(function() {
			console.log('Header JS initialized with overlay fix');
			
			// Try again after document is ready
			fixOverlayPosition();
			
			// Preemptively add no-blur class to header elements
			$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').addClass('no-blur');
			
			// Add direct CSS styles for maximum override power
			$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').css({
				'filter': 'none !important',
				'z-index': '1200',
				'position': 'relative',
				'opacity': '1',
				'visibility': 'visible'
			});
			
			// Enhanced close functionality for search panel
			$('#cd-search-close').off('click').on('click', function(e) {
				console.log('Search close clicked - enhanced handler');
				e.preventDefault();
				e.stopPropagation();
				
				// Hide search panel
				$('#cd-search-panel').css('display', 'none');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				
				return false; // Ensure the event doesn't propagate
			});
			
			// Search Panel Functionality
			$('#cd-search-button, #cd-search-button-mobile').on('click', function(e) {
				e.preventDefault();
				console.log('Search button clicked');
				
				// Try the overlay fix again when opening search
				fixOverlayPosition();
				
				// Explicitly show the search panel
				$('#cd-search-panel').css('display', 'block');
				
				// Only show overlay inside page-main
				$('#cd-overlay').css('display', 'block');
				
				// Apply blur to content areas only
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
				
				// Explicitly ensure header is NOT blurred using more specific selectors
				$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile, .cd-header-left, .cd-header-right, .cd-header-center')
					.addClass('no-blur')
					.css({
						'filter': 'none',
						'z-index': '1200',
						'position': 'relative',
						'opacity': '1',
						'visibility': 'visible'
					});
				
				// Ensure header and search panel have correct z-index
				$('.page-header, .cd-header-container').css('z-index', '1200');
				$('.cd-search-panel').css('z-index', '1100');
				
				// Focus on search input with slight delay to ensure it's visible
				setTimeout(function() {
					$('#cd-search-input').focus();
				}, 100);
			});
			
			$('#cd-search-close').on('click', function() {
				console.log('Search close clicked');
				
				// Hide search panel and overlay
				$('#cd-search-panel').css('display', 'none');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Mini Cart Functionality
			$('#cd-cart-trigger, #cd-cart-trigger-mobile').on('click', function(e) {
				e.preventDefault();
				
				// Try the overlay fix again when opening minicart
				fixOverlayPosition();
				
				$('#cd-minicart').addClass('active');
				$('#cd-overlay').css('display', 'block');
				
				// Apply blur, including breadcrumbs
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
				
				// Explicitly ensure header is NOT blurred using more specific selectors
				$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile, .cd-header-left, .cd-header-right, .cd-header-center')
					.addClass('no-blur')
					.css({
						'filter': 'none',
						'z-index': '1200',
						'position': 'relative',
						'opacity': '1',
						'visibility': 'visible'
					});
				
				// Ensure header and minicart have correct z-index
				$('.page-header, .cd-header-container').css('z-index', '1200');
				$('#cd-minicart').css('z-index', '1100');
			});
			
			$('#cd-minicart-close').on('click', function() {
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').css('display', 'none');
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Close everything when clicking overlay
			$('#cd-overlay').on('click', function() {
				console.log('Overlay clicked');
				
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
			
			// Apply no-blur protection on window load as well
			$(window).on('load', function() {
				// Fix overlay positioning once more
				fixOverlayPosition();
				
				// Reapply no-blur class to header elements
				$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').addClass('no-blur');
				
				// Reinforce CSS
				$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').css({
					'filter': 'none !important',
					'z-index': '1200',
					'position': 'relative',
					'opacity': '1',
					'visibility': 'visible'
				});
				
				// Direct manipulation of search close button for maximum compatibility
				document.getElementById('cd-search-close').onclick = function(e) {
					console.log('Search close clicked - direct handler');
					e.preventDefault();
					e.stopPropagation();
					
					// Hide search panel using direct DOM manipulation
					document.getElementById('cd-search-panel').style.display = 'none';
					
					// Find the overlay whether it's been moved or not
					var overlay = document.querySelector('#cd-overlay');
					if (overlay) overlay.style.display = 'none';
					
					// Remove blur using direct DOM manipulation
					document.querySelectorAll('.page-main, .page-footer, .nav-sections, .breadcrumbs').forEach(function(el) {
						if (el) el.style.filter = 'none';
					});
					
					return false;
				};
			});
		});
	};
});