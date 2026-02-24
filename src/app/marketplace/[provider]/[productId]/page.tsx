'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  ShoppingBag,
  Gift,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Calendar
} from 'lucide-react';
import { getProductById } from '@/components/marketplace/mockData';
import { InlineGiftSelector } from '@/components/marketplace/GiftSelectionModal';
import { Product } from '@/types/marketplace';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  
  const product = useMemo(() => getProductById(productId), [productId]);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [attachedGift, setAttachedGift] = useState<Product | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F2F1E5] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-playfair text-2xl font-bold text-[#2d2d2d] mb-2">
            Product Not Found
          </h1>
          <p className="text-gray-500 mb-4">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#406A56] text-white rounded-xl font-medium"
          >
            <ArrowLeft size={18} />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [product.image];
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsAddingToCart(false);
    // TODO: Actually add to cart
    console.log('Added to cart:', { product, quantity, variant: selectedVariant });
  };

  const handleSendAsGift = () => {
    // Navigate to PostScript creation with this product pre-selected
    router.push(`/dashboard/postscripts/new?giftId=${product.id}`);
  };

  const providerInfo = {
    flowers: { 
      name: 'Fresh Flowers', 
      color: '#C35F33',
      icon: '🌸',
      delivery: product.deliveryType === 'same-day' ? 'Same-day delivery available' : 'Next-day delivery'
    },
    gifts: { 
      name: 'Curated Gifts', 
      color: '#406A56',
      icon: '🎁',
      delivery: 'Ships within 1-2 business days'
    },
    prints: { 
      name: 'Personalized Prints', 
      color: '#4A3552',
      icon: '🖼️',
      delivery: 'Made to order, ships in 3-5 days'
    },
  };

  const info = providerInfo[product.provider];

  return (
    <div className="min-h-screen bg-[#F2F1E5]">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#406A56]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/marketplace"
              className="flex items-center gap-2 text-gray-600 hover:text-[#406A56] transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium hidden sm:inline">Back to Marketplace</span>
            </Link>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite ? 'bg-[#C35F33]/10 text-[#C35F33]' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Discount badge */}
              {discount && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#C35F33] text-white rounded-full text-sm font-bold">
                  -{discount}%
                </div>
              )}

              {/* Bestseller badge */}
              {product.isBestseller && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#D9C61A] text-[#2d2d2d] rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles size={14} />
                  Bestseller
                </div>
              )}

              {/* Image navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx 
                        ? 'border-[#406A56] ring-2 ring-[#406A56]/20' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Provider badge */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: `${info.color}15`,
                color: info.color 
              }}
            >
              <span>{info.icon}</span>
              {info.name}
            </div>

            {/* Title */}
            <div>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-[#2d2d2d] mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < Math.floor(product.rating!) ? 'text-[#D9C61A] fill-[#D9C61A]' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-[#406A56]">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-medium text-[#2d2d2d] mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#406A56] bg-[#406A56]/5 text-[#406A56]'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {variant.name}
                      {variant.price && variant.price !== product.price && (
                        <span className="ml-1 text-xs">
                          (+${(variant.price - product.price).toFixed(2)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-medium text-[#2d2d2d] mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
                {product.stockQuantity && (
                  <span className="text-sm text-gray-500">
                    {product.stockQuantity} available
                  </span>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-200">
              <div className="text-center">
                <Truck size={20} className="mx-auto mb-1 text-[#406A56]" />
                <p className="text-xs text-gray-600">{info.delivery}</p>
              </div>
              <div className="text-center">
                <Shield size={20} className="mx-auto mb-1 text-[#406A56]" />
                <p className="text-xs text-gray-600">Secure checkout</p>
              </div>
              <div className="text-center">
                <RotateCcw size={20} className="mx-auto mb-1 text-[#406A56]" />
                <p className="text-xs text-gray-600">Easy returns</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#406A56] text-white rounded-xl font-semibold text-lg hover:bg-[#355a48] transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    Add to Cart - ${((selectedVariant?.price || product.price) * quantity).toFixed(2)}
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={handleSendAsGift}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-[#406A56] text-[#406A56] rounded-xl font-semibold text-lg hover:bg-[#406A56]/5 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Gift size={20} />
                Send as PostScript Gift
              </motion.button>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize"
                  >
                    {tag.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related products or additional info could go here */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="font-playfair text-2xl font-bold text-[#2d2d2d] mb-6">
            Perfect Pairings
          </h2>
          <p className="text-gray-500">
            Complete your gift with these thoughtful additions...
          </p>
          {/* Could add related products here */}
        </div>
      </div>
    </div>
  );
}
