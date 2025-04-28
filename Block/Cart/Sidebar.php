<?php
/**
 * Copyright © Craven Dunnill. All rights reserved.
 */
namespace CravenDunnill\Header\Block\Cart;

use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Catalog\Model\ProductRepository;
use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Framework\Pricing\Helper\Data as PricingHelper;
use Magento\Store\Model\StoreManagerInterface;

class Sidebar extends Template
{
	/**
	 * @var CheckoutSession
	 */
	protected $checkoutSession;
	
	/**
	 * @var ProductRepository
	 */
	protected $productRepository;
	
	/**
	 * @var ImageHelper
	 */
	protected $imageHelper;
	
	/**
	 * @var PricingHelper
	 */
	protected $pricingHelper;
	
	/**
	 * @var StoreManagerInterface
	 */
	protected $storeManager;
	
	/**
	 * Constructor
	 *
	 * @param Context $context
	 * @param CheckoutSession $checkoutSession
	 * @param ProductRepository $productRepository
	 * @param ImageHelper $imageHelper
	 * @param PricingHelper $pricingHelper
	 * @param StoreManagerInterface $storeManager
	 * @param array $data
	 */
	public function __construct(
		Context $context,
		CheckoutSession $checkoutSession,
		ProductRepository $productRepository,
		ImageHelper $imageHelper,
		PricingHelper $pricingHelper,
		StoreManagerInterface $storeManager,
		array $data = []
	) {
		$this->checkoutSession = $checkoutSession;
		$this->productRepository = $productRepository;
		$this->imageHelper = $imageHelper;
		$this->pricingHelper = $pricingHelper;
		$this->storeManager = $storeManager;
		parent::__construct($context, $data);
	}
	
	/**
	 * Get shopping cart url
	 *
	 * @return string
	 */
	public function getShoppingCartUrl()
	{
		return $this->getUrl('checkout/cart');
	}
	
	/**
	 * Get checkout url
	 *
	 * @return string
	 */
	public function getCheckoutUrl()
	{
		return $this->getUrl('checkout');
	}
	
	/**
	 * Get cart items
	 *
	 * @return array
	 */
	public function getItems()
	{
		$quote = $this->checkoutSession->getQuote();
		return $quote->getAllVisibleItems();
	}
	
	/**
	 * Get formatted price for an item
	 *
	 * @param \Magento\Quote\Model\Quote\Item $item
	 * @return string
	 */
	public function getItemPrice($item)
	{
		return $this->pricingHelper->currency($item->getPrice(), true, false);
	}
	
	/**
	 * Get product image URL for an item
	 *
	 * @param \Magento\Quote\Model\Quote\Item $item
	 * @return string
	 */
	public function getItemProductImageUrl($item)
	{
		try {
			$product = $this->productRepository->getById($item->getProduct()->getId());
			
			// Get media URL for constructing direct image paths
			$mediaUrl = $this->storeManager->getStore()->getBaseUrl(\Magento\Framework\UrlInterface::URL_TYPE_MEDIA);
			
			// Try to get the product image
			try {
				// Check for thumbnail first
				$thumbnail = $product->getThumbnail();
				$smallImage = $product->getSmallImage();
				$baseImage = $product->getImage();
				
				if ($thumbnail && $thumbnail != 'no_selection') {
					// Direct path to thumbnail
					return $mediaUrl . 'catalog/product' . $thumbnail;
				} 
				elseif ($smallImage && $smallImage != 'no_selection') {
					// Fall back to small image
					return $mediaUrl . 'catalog/product' . $smallImage;
				}
				elseif ($baseImage && $baseImage != 'no_selection') {
					// Fall back to base image 
					return $mediaUrl . 'catalog/product' . $baseImage;
				}
				else {
					// No image available, use placeholder
					return $this->imageHelper->getDefaultPlaceholderUrl('thumbnail');
				}
			} catch (\Exception $e) {
				// Error occurred, use placeholder
				return $this->imageHelper->getDefaultPlaceholderUrl('thumbnail');
			}
		} catch (\Exception $e) {
			return $this->imageHelper->getDefaultPlaceholderUrl('thumbnail');
		}
	}
	
	/**
	 * Get cart information
	 *
	 * @return array
	 */
	public function getCartInfo()
	{
		$quote = $this->checkoutSession->getQuote();
		$itemsCount = 0;
		
		foreach ($quote->getAllVisibleItems() as $item) {
			if ($item->getQty() > 0) {
				$itemsCount++;
			}
		}
		
		return [
			'summary_count' => $itemsCount,
			'subtotal' => $this->pricingHelper->currency($quote->getSubtotal(), true, false)
		];
	}
	
	/**
	 * Get subtotal HTML
	 *
	 * @return string
	 */
	public function getSubtotalHtml()
	{
		$quote = $this->checkoutSession->getQuote();
		$subtotal = $quote->getSubtotal();
		return $this->pricingHelper->currency($subtotal, true, false);
	}
}