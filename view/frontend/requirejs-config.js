var config = {
	map: {
		'*': {
			'Magento_Theme/js/view/message': 'Magento_Theme/js/view/message',
			'Magento_Catalog/js/catalog-add-to-cart': 'CravenDunnill_Header/js/catalog-add-to-cart-override'
		}
	},
	paths: {
		'cravendunnill-cart-counter': 'CravenDunnill_Header/js/cart-counter',
		'cravendunnill-minicart-delete': 'CravenDunnill_Header/js/minicart-delete',
		'cravendunnill-add-to-cart-handler': 'CravenDunnill_Header/js/add-to-cart-handler',
		'cravendunnill-add-to-cart-override': 'CravenDunnill_Header/js/add-to-cart-override',
		'cravendunnill-tile-sample-cart-handler': 'CravenDunnill_TileSamples/js/tile-sample-cart-handler'
	},
	// Add this priority loading configuration
	deps: ['cravendunnill-add-to-cart-override', 'cravendunnill-cart-counter'],
	// Set shim for early execution
	shim: {
		'cravendunnill-add-to-cart-override': {
			deps: []
		},
		'cravendunnill-cart-counter': {
			deps: []
		}
	}
};