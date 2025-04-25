define([
	'jquery',
	'Magento_Customer/js/customer-data',
	'jquery/ui'
], function($, customerData) {
	'use strict';
	
	return function(config) {
		// Calculate and store scrollbar width on load
		var calculateScrollbarWidth = function() {
			// Create a temporary div with scrollbar
			var scrollDiv = document.createElement('div');
			scrollDiv.style.cssText = 'width: 100px; height: 100px; overflow: scroll; position: absolute; top: -9999px;';
			document.body.appendChild(scrollDiv);
			
			// Calculate scrollbar width
			var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
			
			// Store it as a CSS variable
			document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
			return scrollbarWidth;
		};
		
		// Calculate scrollbar width on init
		calculateScrollbarWidth();
		
		// SUPER AGGRESSIVE scroll prevention function
		function preventBodyScroll() {
			// Save current scroll position
			var scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
			
			// Store this value so we can restore it later
			window.lastScrollPosition = scrollPosition;
			
			// Force create a style element if it doesn't exist
			if (!window.scrollLockStyleElement) {
				window.scrollLockStyleElement = document.createElement('style');
				window.scrollLockStyleElement.type = 'text/css';
				document.head.appendChild(window.scrollLockStyleElement);
			}
			
			// Inject CSS rules that can't be overridden
			window.scrollLockStyleElement.innerHTML = `
				html, body {
					overflow: hidden !important;
					position: fixed !important;
					width: 100% !important;
					height: 100% !important;
					max-height: 100% !important;
					max-width: 100vw !important;
					touch-action: none !important;
					overscroll-behavior: none !important;
					-webkit-overflow-scrolling: auto !important;
					will-change: transform !important;
					left: 0 !important;
					right: 0 !important;
				}
				
				html.scroll-locked, body.scroll-locked {
					position: fixed !important;
					overflow: hidden !important;
				}
				
				body.scroll-locked {
					top: -${scrollPosition}px !important;
				}
				
				body.scroll-locked .cd-minicart {
					top: -40px !important;
					height: 100vh !important;
					overflow-y: auto !important;
				}
				
				body.scroll-locked .cd-minicart-content,
				body.scroll-locked .cd-search-panel-inner {
					overflow-y: auto !important;
					-webkit-overflow-scrolling: touch !important;
				}
			`;
			
			// Apply necessary classes
			document.documentElement.classList.add('scroll-locked');
			document.body.classList.add('scroll-locked');
			
			// iOS-specific fixes - directly prevent touchmove events on body
			window.scrollLockTouchmoveHandler = function(e) {
				// Allow scrolling in minicart and search panel
				let isInScrollableArea = false;
				let target = e.target;
				
				// Check if the touch is in a scrollable area
				while (target && target !== document.body) {
					if (target.classList.contains('cd-minicart-content') || 
						target.classList.contains('cd-search-panel-inner')) {
						isInScrollableArea = true;
						break;
					}
					target = target.parentNode;
				}
				
				if (!isInScrollableArea) {
					e.preventDefault();
				}
			};
			
			// Add the touchmove event listener
			document.addEventListener('touchmove', window.scrollLockTouchmoveHandler, { passive: false });
			
			// Make absolutely sure the body is locked at the current scroll position
			setTimeout(function() {
				document.body.style.setProperty('top', `-${scrollPosition}px`, 'important');
			}, 0);
		}

		// SUPER AGGRESSIVE scroll restoration function
		function allowBodyScroll() {
			// Remove the style element if it exists
			if (window.scrollLockStyleElement) {
				window.scrollLockStyleElement.innerHTML = '';
			}
			
			// Remove applied classes
			document.documentElement.classList.remove('scroll-locked');
			document.body.classList.remove('scroll-locked');
			
			// Reset any inline styles
			document.body.style.removeProperty('overflow');
			document.body.style.removeProperty('position');
			document.body.style.removeProperty('height');
			document.body.style.removeProperty('width');
			document.body.style.removeProperty('top');
			document.body.style.removeProperty('touch-action');
			
			document.documentElement.style.removeProperty('overflow');
			document.documentElement.style.removeProperty('position');
			document.documentElement.style.removeProperty('height');
			document.documentElement.style.removeProperty('width');
			
			// Remove the touchmove event listener
			if (window.scrollLockTouchmoveHandler) {
				document.removeEventListener('touchmove', window.scrollLockTouchmoveHandler, { passive: false });
			}
			
			// Restore scroll position
			const scrollPosition = window.lastScrollPosition || 0;
			
			// Use multiple methods to ensure scroll position is restored
			setTimeout(function() {
				window.scrollTo(0, scrollPosition);
				if (scrollPosition > 0) {
					$(window).scrollTop(scrollPosition);
					document.documentElement.scrollTop = scrollPosition;
					document.body.scrollTop = scrollPosition;
					
					// One more attempt with a tiny delay
					setTimeout(function() {
						window.scrollTo(0, scrollPosition);
					}, 10);
				}
			}, 0);
		}
		
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
			
			// Allow body to scroll again
			allowBodyScroll();
			
			return false;
		}
		
		// Function to show search panel
		function showSearchPanel() {
			// Try the overlay fix again when opening search
			fixOverlayPosition();
			
			// Prevent body scrolling
			preventBodyScroll();
			
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
				
				// Allow body to scroll again
				allowBodyScroll();
				
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
					
					// Allow body to scroll again
					allowBodyScroll();
				} else {
					// Prevent body scrolling
					preventBodyScroll();
					
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
				
				// Allow body to scroll again
				allowBodyScroll();
			});
			
			// Handle escape key
			$(document).keyup(function(e) {
				if (e.key === "Escape") {
					$('#cd-search-panel').hide();
					$('#cd-minicart').removeClass('active');
					$('#cd-overlay').hide();
					
					// Remove blur from all elements
					$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'none');
					
					// Allow body to scroll again
					allowBodyScroll();
				}
			});
			
			// Make sure scroll is always restored when navigating away
			$(window).on('beforeunload', function() {
				allowBodyScroll();
			});
			
			// Apply scroll locking immediately when needed
			$('#cd-search-button, #cd-search-button-mobile, #cd-cart-trigger, #cd-cart-trigger-mobile')
				.on('mousedown touchstart', function() {
					// Pre-calculate scrollbar width to avoid layout shifts
					calculateScrollbarWidth();
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
				// Recalculate scrollbar width on window load
				calculateScrollbarWidth();
				
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
						
						// Allow body to scroll again
						allowBodyScroll();
						
						if (e) {
							e.preventDefault();
							e.stopPropagation();
						}
						return false;
					};
				}
			});
			
			// Handle resize events
			$(window).on('resize', function() {
				// Recalculate scrollbar width on resize
				calculateScrollbarWidth();
			});
		});
	};
});