<?php
/**
 * Copyright © Craven Dunnill. All rights reserved.
 */
namespace CravenDunnill\Header\Controller\Cart;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Framework\Controller\Result\RawFactory;
use Magento\Checkout\Model\Cart;
use Magento\Framework\Pricing\Helper\Data as PricingHelper;

class Minicart extends Action
{
	/**
	 * @var PageFactory
	 */
	protected $resultPageFactory;
	
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
	 * @param PageFactory $resultPageFactory
	 * @param RawFactory $resultRawFactory
	 * @param Cart $cart
	 * @param PricingHelper $pricingHelper
	 */
	public function __construct(
		Context $context,
		PageFactory $resultPageFactory,
		RawFactory $resultRawFactory,
		Cart $cart,
		PricingHelper $pricingHelper
	) {
		$this->resultPageFactory = $resultPageFactory;
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
		
		// Force cart reload to get most current data
		$this->cart->getQuote()->collectTotals();
		
		$html = $this->getMinicartHtml();
		$result->setContents($html);
		
		return $result;
	}
	
	/**
	 * Get minicart HTML
	 *
	 * @return string
	 */
	protected function getMinicartHtml()
	{
		// Get fresh quote and items
		$quote = $this->cart->getQuote();
		$items = $quote->getAllVisibleItems();
		$itemCount = count($items);
		
		$html = '';
		
		// More strict check for items
		if ($itemCount > 0) {
			$hasValidItems = false;
			
			foreach ($items as $item) {
				// Skip items with zero quantity
				if ($item->getQty() <= 0) {
					continue;
				}
				
				$hasValidItems = true;
				
				// Get product
				$objectManager = \Magento\Framework\App\ObjectManager::getInstance();
				$productRepository = $objectManager->get('\Magento\Catalog\Api\ProductRepositoryInterface');
				
				try {
					$product = $productRepository->getById($item->getProduct()->getId());
					
					// Get media URL for constructing direct image paths
					$storeManager = $objectManager->get('\Magento\Store\Model\StoreManagerInterface');
					$mediaUrl = $storeManager->getStore()->getBaseUrl(\Magento\Framework\UrlInterface::URL_TYPE_MEDIA);
					
					// Get image helper for placeholders
					$imageHelper = $objectManager->get('\Magento\Catalog\Helper\Image');
					
					// Try to get the product image using a direct approach
					try {
						$thumbnail = $product->getThumbnail();
						$smallImage = $product->getSmallImage();
						$baseImage = $product->getImage();
						
						$imageUrl = '';
						if ($thumbnail && $thumbnail != 'no_selection') {
							// Direct path to thumbnail - ensure leading slash
							$thumbnailPath = $thumbnail;
							if (substr($thumbnailPath, 0, 1) !== '/') {
								$thumbnailPath = '/' . $thumbnailPath;
							}
							$imageUrl = $mediaUrl . 'catalog/product' . $thumbnailPath;
						} 
						elseif ($smallImage && $smallImage != 'no_selection') {
							// Fall back to small image - ensure leading slash
							$smallImagePath = $smallImage;
							if (substr($smallImagePath, 0, 1) !== '/') {
								$smallImagePath = '/' . $smallImagePath;
							}
							$imageUrl = $mediaUrl . 'catalog/product' . $smallImagePath;
						}
						elseif ($baseImage && $baseImage != 'no_selection') {
							// Fall back to base image - ensure leading slash
							$baseImagePath = $baseImage;
							if (substr($baseImagePath, 0, 1) !== '/') {
								$baseImagePath = '/' . $baseImagePath;
							}
							$imageUrl = $mediaUrl . 'catalog/product' . $baseImagePath;
						}
						else {
							// No image available, use placeholder
							$imageUrl = $imageHelper->getDefaultPlaceholderUrl('thumbnail');
						}
					} catch (\Exception $e) {
						// Error occurred, use placeholder
						$imageUrl = $imageHelper->getDefaultPlaceholderUrl('thumbnail');
					}
					
					// Get product URL
					$productUrl = $product->getProductUrl();
					
					// Format price properly - try to get several price types
					$price = $item->getPrice();
					if (empty($price)) {
						$price = $item->getCalculationPrice();
					}
					if (empty($price)) {
						$price = $product->getFinalPrice();
					}
					$formattedPrice = $this->pricingHelper->currency($price, true, false);
					
					// Build the item HTML
					$html .= '<div class="cd-product-item">';
					$html .= '<div class="cd-product-image">';
					$html .= '<a href="' . $productUrl . '">';
					$html .= '<img src="' . $imageUrl . '" alt="' . $item->getName() . '">';
					$html .= '</a>';
					$html .= '</div>';
					$html .= '<div class="cd-product-details">';
					$html .= '<div class="cd-product-name">';
					$html .= '<a href="' . $productUrl . '">' . $item->getName() . '</a>';
					$html .= '</div>';
					$html .= '<div class="cd-product-price">';
					$html .= $formattedPrice;
					$html .= '</div>';
					$html .= '<div class="cd-product-qty">';
					$html .= 'Qty: ' . (int)$item->getQty();
					$html .= '</div>';
					$html .= '</div>';
					$html .= '</div>';
				} catch (\Exception $e) {
					// If there's any error with this item, skip it
					continue;
				}
			}
			
			// If we processed all items but found none valid, show empty cart
			if (!$hasValidItems) {
				$html = '<div class="cd-empty-cart">';
				$html .= '<p>You have no items in your trolley.</p>';
				$html .= '</div>';
			}
		} else {
			$html .= '<div class="cd-empty-cart">';
			$html .= '<p>You have no items in your trolley.</p>';
			$html .= '</div>';
		}
		
		return $html;
	}
}