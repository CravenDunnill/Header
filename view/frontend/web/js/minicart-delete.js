define([
	'jquery',
	'Magento_Customer/js/customer-data',
	'mage/translate',
	'Magento_Ui/js/modal/confirm',
	'mage/url'
], function($, customerData, $t, confirm, url) {
	'use strict';
	
	return function(config) {
		// Fix view trolley and checkout links
		function fixCartLinks() {
			// Set view cart URL
			if ($('.cd-view-cart').length && !$('.cd-view-cart').attr('href')) {
				$('.cd-view-cart').attr('href', url.build('checkout/cart'));
			}
			
			// Set checkout URL
			if ($('.cd-checkout').length && !$('.cd-checkout').attr('href')) {
				$('.cd-checkout').attr('href', url.build('checkout'));
			}
		}

		// Function to handle item deletion
		function setupDeleteHandlers() {
			// Fix cart links first
			fixCartLinks();
			
			// Use direct handler binding for maximum compatibility
			$('.cd-minicart .action.delete').each(function() {
				$(this).off('click').on('click', function(e) {
					e.preventDefault();
					e.stopPropagation();
					
					var $button = $(this);
					var itemId = $button.attr('data-cart-item');
					var itemName = $button.closest('.cd-product-item').find('.cd-product-name a').text().trim();
					
					// Get form key
					var formKey = $.cookie('form_key') || $('input[name="form_key"]').val();
					
					// Show confirmation modal
					confirm({
						title: $t('Remove Item'),
						content: $t('Are you sure you want to remove "%1"?').replace('%1', itemName),
						actions: {
							confirm: function() {
								// If confirmed, delete item
								deleteItem(itemId, formKey);
							}
						}
					});
				});
			});
			
			// Also use event delegation as a fallback for dynamically added elements
			$(document).off('click', '#cd-minicart .action.delete').on('click', '#cd-minicart .action.delete', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				var $button = $(this);
				var itemId = $button.attr('data-cart-item');
				var itemName = $button.closest('.cd-product-item').find('.cd-product-name a').text().trim();
				
				// Get form key
				var formKey = $.cookie('form_key') || $('input[name="form_key"]').val();
				
				// Show confirmation modal
				confirm({
					title: $t('Remove Item'),
					content: $t('Are you sure you want to remove "%1"?').replace('%1', itemName),
					actions: {
						confirm: function() {
							// If confirmed, delete item
							deleteItem(itemId, formKey);
						}
					}
				});
			});
			
			// Also handle the KO-based delete buttons
			$(document).off('click', '#cd-minicart [data-bind*="data-cart-item"]').on('click', '#cd-minicart [data-bind*="data-cart-item"]', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				var $button = $(this);
				var itemId = $button.attr('data-cart-item');
				var itemName = $button.closest('.cd-product-item').find('.cd-product-name a').text().trim();
				
				// Get form key
				var formKey = $.cookie('form_key') || $('input[name="form_key"]').val();
				
				// Show confirmation modal
				confirm({
					title: $t('Remove Item'),
					content: $t('Are you sure you want to remove "%1"?').replace('%1', itemName),
					actions: {
						confirm: function() {
							// If confirmed, delete item
							deleteItem(itemId, formKey);
						}
					}
				});
			});
		}
		
		// Function to delete an item via AJAX
		function deleteItem(itemId, formKey) {
			if (!itemId) {
				console.error('No item ID provided for deletion');
				return;
			}
			
			// Add loading class to minicart content
			$('.cd-minicart-content').addClass('loading');
			
			// Get proper URL for removing item
			var removeUrl = url.build('checkout/sidebar/removeItem');
			
			// Send AJAX request to remove item
			$.ajax({
				url: removeUrl,
				type: 'POST',
				data: {
					'item_id': itemId,
					'form_key': formKey
				},
				success: function(response) {
					// Force refresh of cart data
					customerData.invalidate(['cart']);
					customerData.reload(['cart'], true).done(function() {
						// Update the cart visuals
						updateCartAfterDelete();
						// Fix cart links again
						fixCartLinks();
					});
				},
				error: function(xhr, status, error) {
					console.error('Error removing item:', error);
					
					// Remove loading state
					$('.cd-minicart-content').removeClass('loading');
					
					// Still try to refresh cart data in case the item was actually removed
					customerData.reload(['cart'], true);
				}
			});
		}
		
		// Update cart visuals after deletion
		function updateCartAfterDelete() {
			// Get updated cart data
			var cartData = customerData.get('cart')();
			
			// Update cart counter
			if (cartData && cartData.summary_count > 0) {
				$('.cd-cart-counter').text(cartData.summary_count).show();
			} else {
				$('.cd-cart-counter').hide();
				
				// If cart is empty, update minicart content
				$('.cd-minicart-items').html(
					'<div class="cd-empty-cart">' +
					'<p>You have no items in your trolley.</p>' +
					'</div>'
				);
				
				// Hide checkout buttons
				$('.cd-minicart-buttons').hide();
			}
			
			// Refresh minicart content via AJAX
			$.ajax({
				url: '/cravendunnill_header/cart/minicart',
				type: 'GET',
				success: function(response) {
					if (response) {
						// Update the minicart items
						$('.cd-minicart-items').html(response);
					}
					
					// Remove loading state
					$('.cd-minicart-content').removeClass('loading');
					
					// Also update subtotal
					updateSubtotal();
				},
				error: function(error) {
					console.error('Error updating minicart HTML:', error);
					$('.cd-minicart-content').removeClass('loading');
				}
			});
		}
		
		// Function to update just the subtotal
		function updateSubtotal() {
			$.ajax({
				url: '/cravendunnill_header/cart/subtotal',
				type: 'GET',
				success: function(response) {
					if (response) {
						$('#cd-minicart-subtotal').html(response);
					}
				},
				error: function(error) {
					console.error('Error updating subtotal:', error);
				}
			});
		}
		
		// Setup handlers once DOM is ready
		$(document).ready(function() {
			// Initial setup
			setupDeleteHandlers();
			fixCartLinks();
			
			// Add additional direct click handler for the bin icon specifically
			$('.cd-minicart .action.delete').off('click.delete').on('click.delete', function(e) {
				e.preventDefault();
				e.stopPropagation();
				
				var $button = $(this);
				var itemId = $button.attr('data-cart-item');
				if (!itemId) {
					// Try to get item ID from data-post-param
					var dataPost = $button.attr('data-post');
					if (dataPost) {
						try {
							var postData = JSON.parse(dataPost);
							if (postData && postData.data && postData.data.item_id) {
								itemId = postData.data.item_id;
							}
						} catch (e) {
							console.error('Error parsing data-post attribute:', e);
						}
					}
				}
				
				var itemName = $button.closest('.cd-product-item').find('.cd-product-name a').text().trim();
				
				// Get form key
				var formKey = $.cookie('form_key') || $('input[name="form_key"]').val();
				
				if (itemId) {
					// Show confirmation modal
					confirm({
						title: $t('Remove Item'),
						content: $t('Are you sure you want to remove "%1"?').replace('%1', itemName),
						actions: {
							confirm: function() {
								// If confirmed, delete item
								deleteItem(itemId, formKey);
							}
						}
					});
				} else {
					console.error('Could not find item ID for deletion');
				}
			});
			
			// Run repeated checks for the delete buttons and links
			setTimeout(setupDeleteHandlers, 500);
			setTimeout(setupDeleteHandlers, 1000);
			setTimeout(setupDeleteHandlers, 2000);
			
			// Setup a mutation observer to handle dynamically added delete buttons
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if (mutation.type === 'childList' && mutation.addedNodes.length) {
						setupDeleteHandlers();
						fixCartLinks();
					}
				});
			});
			
			// Observe the minicart content
			var minicartContent = document.querySelector('.cd-minicart-content');
			if (minicartContent) {
				observer.observe(minicartContent, { childList: true, subtree: true });
			}
			
			// Also observe the entire minicart for class changes (e.g., when it becomes active)
			var minicart = document.getElementById('cd-minicart');
			if (minicart) {
				observer.observe(minicart, { attributes: true, attributeFilter: ['class'] });
			}
		});
	};
});