<?php
/**
 * Copyright © Craven Dunnill. All rights reserved.
 */
namespace CravenDunnill\Header\Controller\Cart;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\RawFactory;
use Magento\Checkout\Model\Cart;
use Magento\Framework\Pricing\Helper\Data as PricingHelper;

class Subtotal extends Action
{
	/**
	 * @var RawFactory
	 */
	protected $resultRawFactory;
	
	/**
	 * @var Cart
	 */
	protected $cart;
	
	/**
	 * @var PricingHelper
	 */
	protected $pricingHelper;
	
	/**
	 * Constructor
	 *
	 * @param Context $context
	 * @param RawFactory $resultRawFactory
	 * @param Cart $cart
	 * @param PricingHelper $pricingHelper
	 */
	public function __construct(
		Context $context,
		RawFactory $resultRawFactory,
		Cart $cart,
		PricingHelper $pricingHelper
	) {
		$this->resultRawFactory = $resultRawFactory;
		$this->cart = $cart;
		$this->pricingHelper = $pricingHelper;
		parent::__construct($context);
	}
	
	/**
	 * Execute view action
	 *
	 * @return \Magento\Framework\Controller\ResultInterface
	 */
	public function execute()
	{
		$result = $this->resultRawFactory->create();
		$result->setHeader('Content-Type', 'text/html');
		
		$html = $this->getSubtotalHtml();
		$result->setContents($html);
		
		return $result;
	}
	
	/**
	 * Get subtotal HTML
	 *
	 * @return string
	 */
	protected function getSubtotalHtml()
	{
		// Get cart subtotal
		$quote = $this->cart->getQuote();
		$subtotal = $quote->getSubtotal();
		
		// Format subtotal properly
		$formattedSubtotal = $this->pricingHelper->currency($subtotal, true, false);
		
		// Build HTML
		$html = '<div class="subtotal">';
		$html .= '<span class="label">Subtotal</span>';
		$html .= '<span class="price">' . $formattedSubtotal . '</span>';
		$html .= '</div>';
		
		return $html;
	}
}