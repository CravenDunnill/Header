<?php
/**
 * Copyright © Craven Dunnill. All rights reserved.
 */
namespace CravenDunnill\Header\Block\Html;

class Header extends \Magento\Framework\View\Element\Template
{
	/**
	 * @var \Magento\Customer\Model\Session
	 */
	protected $customerSession;

	/**
	 * @var \Magento\Checkout\Model\Session
	 */
	protected $checkoutSession;

	/**
	 * @param \Magento\Framework\View\Element\Template\Context $context
	 * @param \Magento\Customer\Model\Session $customerSession
	 * @param \Magento\Checkout\Model\Session $checkoutSession
	 * @param array $data
	 */
	public function __construct(
		\Magento\Framework\View\Element\Template\Context $context,
		\Magento\Customer\Model\Session $customerSession,
		\Magento\Checkout\Model\Session $checkoutSession,
		array $data = []
	) {
		$this->customerSession = $customerSession;
		$this->checkoutSession = $checkoutSession;
		parent::__construct($context, $data);
	}

	/**
	 * Get cart item count
	 *
	 * @return int
	 */
	public function getCartItemCount()
	{
		return $this->checkoutSession->getQuote()->getItemsCount();
	}

	/**
	 * Check if customer is logged in
	 *
	 * @return bool
	 */
	public function isCustomerLoggedIn()
	{
		return $this->customerSession->isLoggedIn();
	}

	/**
	 * Get wishlist url
	 *
	 * @return string
	 */
	public function getWishlistUrl()
	{
		return $this->getUrl('wishlist');
	}

	/**
	 * Get customer account url
	 *
	 * @return string
	 */
	public function getAccountUrl()
	{
		return $this->getUrl('customer/account');
	}

	/**
	 * Get cart url
	 *
	 * @return string
	 */
	public function getCartUrl()
	{
		return $this->getUrl('checkout/cart');
	}

	/**
	 * Get search url
	 *
	 * @return string
	 */
	public function getSearchUrl()
	{
		return $this->getUrl('catalogsearch/result');
	}
}