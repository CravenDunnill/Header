/**
 * Override of Magento's catalog-add-to-cart.js
 * This file directly overrides Magento's core add-to-cart functionality
 */
define([
	'jquery',
	'mage/translate',
	'jquery/ui',
	'Magento_Catalog/js/catalog-add-to-cart',
	'cravendunnill-add-to-cart-override'
], function($, $t) {
	'use strict';

	console.log('[CD] Catalog add-to-cart override loaded');

	$.widget('mage.catalogAddToCart', $.mage.catalogAddToCart, {
		/**
		 * Override the success handler to open the minicart
		 * @param {Object} response
		 * @private
		 */
		success: function (response) {
			console.log('[CD] Overridden success handler called');
			
			var self = this,
				$form = $(response.info.options.form),
				isAddToCartRequest = $form.length && $form.is('[data-role="tocart-form"]');

			// Handle add to cart success
			if (isAddToCartRequest) {
				console.log('[CD] Processing add to cart success');
				
				// Call parent method
				this._super(response);
				
				// Force open minicart after parent success
				if (typeof window.forceOpenMinicart === 'function') {
					console.log('[CD] Calling forceOpenMinicart from catalog-add-to-cart');
					setTimeout(function() {
						window.forceOpenMinicart();
					}, 500);
				} else {
					console.log('[CD] forceOpenMinicart not available, using direct method');
					// Fallback to direct manipulation
					setTimeout(function() {
						$('#cd-minicart').addClass('active');
						$('#cd-overlay').css('display', 'block');
						$('.page-main, .page-footer, .nav-sections, .breadcrumbs').css('filter', 'blur(4px)');
					}, 500);
				}
			} else {
				// Just call parent method for non-cart actions
				this._super(response);
			}
		}
	});

	return $.mage.catalogAddToCart;
});