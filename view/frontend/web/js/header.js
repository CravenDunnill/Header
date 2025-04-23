define([
	'jquery',
	'Magento_Customer/js/customer-data',
	'jquery/ui'
], function($, customerData) {
	'use strict';
	
	return function(config) {
		// Critical fix: Move the overlay to a position that won't cover the header
		function fixOverlayPosition() {
			// Move overlay to be a child of page-main instead of being at the top level
			const $overlay = $('#cd-overlay');
			const $pageMain = $('.page-main');
			
			if ($overlay.length && $pageMain.length) {
				// Only move if not already positioned correctly
				if (!$overlay.parent().is($pageMain)) {
					// Clone the overlay to preserve event handlers
					const $newOverlay = $overlay.clone(true);
					
					// Remove the original
					$overlay.remove();
					
					// Add the clone to page-main
					$pageMain.prepend($newOverlay);
					
					// Fix positioning
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
		
		// Function to close search panel - declared globally to be reused
		function closeSearchPanel(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			
			console.log('Closing search panel');
			
			// Use both direct DOM and jQuery for maximum compatibility
			$('#cd-search-panel').hide();
			if (document.getElementById('cd-search-panel')) {
				document.getElementById('cd-search-panel').style.display = 'none';
			}
			
			$('#cd-overlay').hide();
			if (document.getElementById('cd-overlay')) {
				document.getElementById('cd-overlay').style.display = 'none';
			}
			
			// Remove blur from all elements
			$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			
			return false;
		}
		
		// Function to show search panel
		function showSearchPanel() {
			// Try the overlay fix again when opening search
			fixOverlayPosition();
			
			// Explicitly show the search panel
			$('#cd-search-panel').show();
			if (document.getElementById('cd-search-panel')) {
				document.getElementById('cd-search-panel').style.display = 'block';
			}
			
			// Only show overlay inside page-main
			$('#cd-overlay').show();
			if (document.getElementById('cd-overlay')) {
				document.getElementById('cd-overlay').style.display = 'block';
			}
			
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
		}
		
		// Function to toggle search panel visibility
		function toggleSearchPanel(e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			
			console.log('Toggle search panel');
			
			// Check if search panel is currently visible
			var searchPanel = document.getElementById('cd-search-panel');
			var isVisible = searchPanel && (searchPanel.style.display === 'block' || $(searchPanel).is(':visible'));
			
			if (isVisible) {
				closeSearchPanel();
			} else {
				showSearchPanel();
			}
			
			return false;
		}
		
		// Initialize cart counter
		function updateCartCounter() {
			var cartData = customerData.get('cart');
			
			if (cartData() && cartData().summary_count > 0) {
				$('.cd-cart-counter').show();
			} else {
				$('.cd-cart-counter').hide();
			}
		}
		
		// Apply before document ready for maximum effectiveness
		fixOverlayPosition();
		
		// Execute immediately - don't wait for document ready
		$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').addClass('no-blur');
		
		$(document).ready(function() {
			console.log('Header JS initialized with fixed toggle functionality');
			
			// Initialize minicart data
			var cartData = customerData.get('cart');
			cartData.subscribe(function (updatedCart) {
				updateCartCounter();
			});
			
			// Initial update of cart counter
			updateCartCounter();
			
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
			
			// Unbind any existing handlers first to prevent duplicates
			$('#cd-search-button, #cd-search-button-mobile').off('click');
			$('#cd-search-close').off('click');
			$('#cd-overlay').off('click');
			
			// Bind search toggle functionality
			$('#cd-search-button, #cd-search-button-mobile').on('click', function(e) {
				return toggleSearchPanel(e);
			});
			
			// Bind search close functionality
			$('#cd-search-close').on('click', function(e) {
				return closeSearchPanel(e);
			});
			
			// Close everything when clicking overlay
			$('#cd-overlay').on('click', function(e) {
				console.log('Overlay clicked');
				
				// Close search panel
				$('#cd-search-panel').hide();
				
				// Close minicart
				$('#cd-minicart').removeClass('active');
				
				// Hide overlay
				$('#cd-overlay').hide();
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			
			// Mini Cart Functionality - Updated for proper toggle
			$('#cd-cart-trigger, #cd-cart-trigger-mobile').on('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				// Try the overlay fix again when opening minicart
				fixOverlayPosition();
				
				// Force initialization of minicart content
				customerData.reload(['cart'], false);
				
				// Check if mini cart is currently visible
				if ($('#cd-minicart').hasClass('active')) {
					// Hide minicart
					$('#cd-minicart').removeClass('active');
					$('#cd-overlay').hide();
					
					// Remove blur from content
					$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				} else {
					// Show minicart
					$('#cd-minicart').addClass('active');
					$('#cd-overlay').show();
					
					// Apply blur to content areas
					$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
					
					// Ensure header is not blurred
					$('.page-header, header.page-header, .cd-header-container').css({
						'filter': 'none',
						'z-index': '1200'
					});
				}
			});
			
			// Mini Cart Close Button
			$('#cd-minicart-close').on('click', function() {
				$('#cd-minicart').removeClass('active');
				$('#cd-overlay').hide();
				
				// Remove blur from all elements
				$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
			});
			
			// Handle escape key
			$(document).keyup(function(e) {
				if (e.key === "Escape") {
					$('#cd-search-panel').hide();
					$('#cd-minicart').removeClass('active');
					$('#cd-overlay').hide();
					
					// Remove blur from all elements
					$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
				}
			});
			
			// Update cart counter when cart is updated
			$(document).on('ajax:updateCartItemQty ajax:addToCart', function() {
				setTimeout(function() {
					updateCartCounter();
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
				
				// Direct DOM manipulation for search functionality for maximum compatibility
				if (document.getElementById('cd-search-close')) {
					document.getElementById('cd-search-close').onclick = closeSearchPanel;
				}
				
				if (document.getElementById('cd-search-button')) {
					document.getElementById('cd-search-button').onclick = toggleSearchPanel;
				}
				
				if (document.getElementById('cd-search-button-mobile')) {
					document.getElementById('cd-search-button-mobile').onclick = toggleSearchPanel;
				}
				
				if (document.getElementById('cd-overlay')) {
					document.getElementById('cd-overlay').onclick = function(e) {
						console.log('Overlay clicked (direct DOM)');
						closeSearchPanel(e);
						
						// Also close minicart
						var minicart = document.getElementById('cd-minicart');
						if (minicart) {
							minicart.classList.remove('active');
						}
						
						if (e) {
							e.preventDefault();
							e.stopPropagation();
						}
						return false;
					};
				}
			});
		});
	};
});