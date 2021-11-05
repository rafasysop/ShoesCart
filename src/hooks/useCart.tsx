/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      const searchProduct = newCart.find(product => product.id === productId)

      if (searchProduct) {
        const  amountProduct = searchProduct.amount
        const stock = (await api.get(`/stock/${productId}`)).data
        
        if (amountProduct === stock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        } 

        searchProduct.amount +=  1
      } else {
        const searchProductObj = (await api.get(`/products/${productId}`)).data
        newCart.push({...searchProductObj, amount: 1})
      }
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const searchProduct = cart.find(product => product.id === productId)
      if (!searchProduct) throw new Error();
      const newCart = [...cart.filter(product => product.id !== productId)]
      
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart]
      const searchProduct = newCart.find(product => product.id === productId)
        const stock = (await api.get(`/stock/${productId}`)).data
        
        if (searchProduct){
          if (amount > stock.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return
          } 
          if (amount <= 1) return
          searchProduct.amount = amount
        }
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
