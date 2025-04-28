<?php
/**
 * Copyright © Craven Dunnill. All rights reserved.
 */
namespace CravenDunnill\Header\Controller\Cart;

use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\View\Result\PageFactory;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Framework\Controller\Result\JsonFactory;

class Items extends Action
{
	/**
	 * @var PageFactory
	 */
	protected $resultPageFactory;
	
	/**
	 * @var CheckoutSession
	 */
	protected $checkoutSession;
	
	/**
	 * @var JsonFactory
	 */
	protected $jsonFactory;

	/**
	 * Constructor
	 *
	 * @param Context $context
	 * @param PageFactory $resultPageFactory
	 * @param CheckoutSession $checkoutSession
	 * @param JsonFactory $jsonFactory
	 */
	public function __construct(
		Context $context,
		PageFactory $resultPageFactory,
		CheckoutSession $checkoutSession,
		JsonFactory $jsonFactory
	) {
		$this->resultPageFactory = $resultPageFactory;
		$this->checkoutSession = $checkoutSession;
		$this->jsonFactory = $jsonFactory;
		parent::__construct($context);
	}

	/**
	 * Execute view action
	 *
	 * @return \Magento\Framework\Controller\Result\Json
	 */
	public function execute()
	{
		$result = $this->jsonFactory->create();
		$resultPage = $this->resultPageFactory->create();
		
		// Get the minicart block
		$minicartBlock = $resultPage->getLayout()->createBlock(
			\CravenDunnill\Header\Block\Cart\Sidebar::class,
			'minicart_content',
			['template' => 'CravenDunnill_Header::ko/checkout/minicart.phtml']
		);
		
		// Return cart data as JSON
		$quote = $this->checkoutSession->getQuote();
		$itemsHtml = $minicartBlock->toHtml();
		$itemCount = $quote->getItemsCount();
		
		$result->setData([
			'success' => true,
			'html' => $itemsHtml,
			'items_count' => $itemCount
		]);
		
		return $result;
	}
}