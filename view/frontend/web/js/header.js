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
		
		// Direct fix for unwanted template text
		function removeTemplateText() {
			// Directly target any text containing the problematic string
			var elements = document.getElementsByTagName('*');
			for (var i = 0; i < elements.length; i++) {
				var element = elements[i];
				
				// Only process text nodes (nodeType 3)
				for (var j = 0; j < element.childNodes.length; j++) {
					var node = element.childNodes[j];
					if (node.nodeType === 3) {
						var text = node.nodeValue;
						if (text && text.indexOf('Magento_Theme/js/view/message') !== -1) {
							// Replace the unwanted text with empty string
							node.nodeValue = '';
							console.log('Found and removed template text');
						}
					}
				}
			}
		}
		
		// More subtle message fix that preserves formatting and auto-hide behavior
		function fixMagentoMessages() {
			// Only target the specific message containers without changing styling
			var containers = [
				'.page.messages',
				'.messages'
			];
			
			// Find any message containers
			$(containers.join(', ')).each(function() {
				var $this = $(this);
				
				// Only make it visible, don't change styling
				$this.css({
					'display': 'block',
					'visibility': 'visible',
					'opacity': '1'
				});
				
				// Make sure parent containers are visible without changing their styling
				$this.parents().each(function() {
					// Skip body and html
					if (this.tagName.toLowerCase() !== 'body' && this.tagName.toLowerCase() !== 'html') {
						var $parent = $(this);
						var parentStyle = window.getComputedStyle(this);
						
						// Only fix visibility if it's hidden
						if (parentStyle.display === 'none') {
							$parent.css('display', 'block');
						}
						
						if (parentStyle.visibility === 'hidden') {
							$parent.css('visibility', 'visible');
						}
						
						if (parentStyle.opacity === '0') {
							$parent.css('opacity', '1');
						}
					}
				});
			});
		}
		
		// Function to show confirmation message
		function showCartConfirmation(message) {
			// Create confirmation element if it doesn't exist
			if (!$('#cd-cart-confirmation').length) {
				$('body').append('<div id="cd-cart-confirmation"></div>');
			}
			
			var $confirmation = $('#cd-cart-confirmation');
			
			// Set message
			$confirmation.html(message);
			
			// Show and then hide after delay
			$confirmation.addClass('active');
			
			// Hide after 3 seconds
			setTimeout(function() {
				$confirmation.removeClass('active');
			}, 3000);
		}
		
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
			
			// Check messages once
			fixMagentoMessages();
			
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
			
			// Check messages once
			fixMagentoMessages();
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
				$('.cd-cart-counter').text(cartData().summary_count).show();
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
		
		// Improved minicart content refresh function
		function refreshMiniCartContent() {
			console.log('Refreshing minicart content');
			
			// Add visual loading indicator
			$('.cd-minicart-content').addClass('loading');
			
			// Log cart data from customer-data store
			var cartData = customerData.get('cart')();
			console.log('Current cart data:', cartData);
			
			// First, check if sections data needs refreshing
			$.ajax({
				url: '/customer/section/load/?sections=cart&force_new_section_timestamp=true',
				type: 'GET',
				cache: false,
				dataType: 'json',
				success: function(response) {
					console.log('Section load response:', response);
					
					if (response && response.cart) {
						updateMinicartHtml();
					} else {
						console.log('No cart data in response, trying direct update');
						updateMinicartHtml();
					}
				},
				error: function(error) {
					console.error('Error refreshing cart sections:', error);
					// Even if sections refresh fails, try direct HTML update
					updateMinicartHtml();
				}
			});
		}
		
		// Function to update the minicart HTML content with error handling
		function updateMinicartHtml() {
			console.log('Updating minicart HTML');
			
			$.ajax({
				url: '/cravendunnill_header/cart/minicart',
				type: 'GET',
				cache: false,
				success: function(response) {
					if (response) {
						console.log('Minicart HTML received:', response.substr(0, 100) + '...');
						
						// Update the minicart items
						$('.cd-minicart-items').html(response);
						
						// Also update subtotal
						updateSubtotal();
					}
					
					// Remove loading state
					$('.cd-minicart-content').removeClass('loading');
				},
				error: function(error) {
					console.error('Error updating minicart HTML:', error);
					$('.cd-minicart-content').removeClass('loading');
					
					// Show error in minicart
					$('.cd-minicart-items').html('<div class="cd-empty-cart"><p>Could not update cart. Please refresh the page.</p></div>');
				}
			});
		}
		
		// Function to update just the subtotal
		function updateSubtotal() {
			console.log('Updating subtotal');
			
			$.ajax({
				url: '/cravendunnill_header/cart/subtotal',
				type: 'GET',
				cache: false,
				success: function(response) {
					console.log('Subtotal HTML received');
					
					if (response) {
						$('#cd-minicart-subtotal').html(response);
					}
				},
				error: function(error) {
					console.error('Error updating subtotal:', error);
				}
			});
		}
		
		// Apply before document ready for maximum effectiveness
		fixOverlayPosition();
		
		// Execute immediately - don't wait for document ready
		$('.page-header, header.page-header, .cd-header-container, .cd-header-desktop, .cd-header-mobile').addClass('no-blur');
		
		// Initial run of message fix - just once
		fixMagentoMessages();
		
		// Run immediately
		removeTemplateText();

		// Run again after a delay
		setTimeout(removeTemplateText, 100);
		setTimeout(removeTemplateText, 500);
		setTimeout(removeTemplateText, 1500);

		// Run on mutation events to catch dynamically added content
		var observer = new MutationObserver(function(mutations) {
			removeTemplateText();
		});

		if (document.body) {
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		} else {
			document.addEventListener('DOMContentLoaded', function() {
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
			});
		}
		
		$(document).ready(function() {
			console.log('Header JS initialized with fixed toggle functionality');
			
			// Run the fix for unprocessed message templates
			removeTemplateText();
			
			// Initialize minicart data
			var cartData = customerData.get('cart');
			
			// Force an immediate refresh when page loads
			customerData.reload(['cart'], true);
			
			// Setup cart data subscription with direct DOM updates
			cartData.subscribe(function(updatedCart) {
				// Update cart counter
				updateCartCounter();
				
				// Update minicart content
				refreshMiniCartContent();
			});
			
			// Initial update of cart counter
			updateCartCounter();
			
			// Try again after document is ready
			fixOverlayPosition();
			
			// Check for any existing messages - just once
			fixMagentoMessages();
			
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
				
				// Force refresh of cart data and content
				customerData.reload(['cart'], false);
				refreshMiniCartContent();
				
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
			
			// Improved event detection without blocking native messages
			$(document).on('ajax:addToCart', function(event) {
				console.log('Product added to cart event detected');
				
				// Fix messages visibility - just once
				setTimeout(fixMagentoMessages, 100);
				setTimeout(removeTemplateText, 100);
				
				// Update the cart data silently
				setTimeout(function() {
					customerData.reload(['cart'], true);
					refreshMiniCartContent();
				}, 500);
			});
			
			// Listen for the custom add-to-cart event that Magento fires
			$('body').on('product:addToCartComplete', function(event) {
				console.log('Custom add to cart event detected');
				
				// Fix messages visibility - just once
				setTimeout(fixMagentoMessages, 100);
				setTimeout(removeTemplateText, 100);
				
				// Only refresh the cart data without showing our custom message
				customerData.reload(['cart'], true);
				refreshMiniCartContent();
			});
			
			// Additional direct event listener for add to cart button
			$('body').on('click', 'button.action.tocart', function() {
				console.log('Add to cart button clicked');
				
				// Don't do anything here that might interfere with Magento's native flow
				// Just set a timeout to make sure the cart data is refreshed after Magento has processed
				setTimeout(function() {
					customerData.reload(['cart'], true);
					refreshMiniCartContent();
					removeTemplateText();
				}, 1000);
			});
			
			// Modified ajaxSuccess handler to immediately ensure messages are visible
			$(document).ajaxSuccess(function(event, xhr, settings) {
				// Check if this is an add to cart request
				if (settings.url.indexOf('checkout/cart/add') !== -1) {
					console.log('AJAX success detected for cart add operation');
					
					// Make sure Magento messages are visible - just once
					setTimeout(fixMagentoMessages, 100);
					setTimeout(removeTemplateText, 100);
					
					// Then refresh the cart data
					setTimeout(function() {
						customerData.reload(['cart'], true);
						refreshMiniCartContent();
					}, 500);
				} else if (settings.url.indexOf('customer/section/load') !== -1) {
					// Cart section update detected
					console.log('Cart section update detected');
					refreshMiniCartContent();
				}
				
				// Always check for template text after AJAX
				removeTemplateText();
			});
			
			// Listen for update cart events
			$(document).on('ajax:updateCartItemQty', function() {
				// Refresh the cart data
				customerData.reload(['cart'], true);
				
				// Update the minicart content
				setTimeout(function() {
					refreshMiniCartContent();
				}, 500);
			});
			
			// Listen for remove from cart events
			$(document).on('ajax:removeFromCart', function() {
				// Refresh the cart data
				customerData.reload(['cart'], true);
				
				// Update the minicart content
				setTimeout(function() {
					refreshMiniCartContent();
				}, 500);
			});
			
			// Manual testing function - for debugging from console
			window.testCartRefresh = function() {
				console.log('Manual cart refresh triggered');
				customerData.reload(['cart'], true);
				refreshMiniCartContent();
				return 'Cart refresh triggered';
			};
			
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
				
				// Final check for template text
				removeTemplateText();
			});
			
			// Handle resize events
			$(window).on('resize', function() {
				// Recalculate scrollbar width on resize
				calculateScrollbarWidth();
			});
			
			// Periodically check for cart updates
			setInterval(function() {
				customerData.reload(['cart'], false);
			}, 60000);  // Check every minute
		});
	};
});