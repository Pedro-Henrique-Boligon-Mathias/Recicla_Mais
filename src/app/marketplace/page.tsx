"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Leaf, Recycle, ArrowRight, Plus, Search, Filter, ShoppingBag, RefreshCw, Heart, Trash, Pencil, User } from "lucide-react";
import { useRouter } from "next/navigation";

type ItemType = 'produto' | 'troca';

interface MarketplaceItem {
  id: number;
  type: ItemType;
  title: string;
  description: string;
  price?: string;
  image_path: string;
  category: string;
  posted_by: string;
  location: string;
  user_id?: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ItemType | 'todos'>('todos');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Higiene',
    type: 'produto' as ItemType,
    image: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'my-items'>('market');
  
  const categories = [
    'Higiene', 'Cozinha', 'Decoração', 'Educação', 'Transporte', 'Móveis', 'Roupas'
  ];

  // Buscar informações do usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erro ao buscar usuário:', error);
      } else {
        setUser(user);
      }
    };
    getUser();
  }, []);

  // Buscar itens do marketplace
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setItems(data || []);
      } catch (error) {
        console.error('Erro ao buscar itens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Obter URL da imagem
  const getImageUrl = (path: string) => {
    if (!path) return '';
    const { data } = supabase.storage.from('marketplace-images').getPublicUrl(path);
    return data.publicUrl || '';
  };

  // Filtrar itens do mercado
  const filteredMarketItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = activeFilter === 'todos' || item.type === activeFilter;
    const matchesCategory = activeCategory === 'todos' || item.category === activeCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Filtrar itens do usuário
  const myItems = items.filter(item => item.user_id === user?.id);

  // Manipular mudanças no formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  // Manipular upload de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewItem(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  // Publicar novo item
  const handleSubmitItem = async () => {
    if (!user) {
      alert('Você precisa estar logado para publicar um item!');
      return;
    }

    if (!newItem.title || !newItem.description || !newItem.image) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    setUploading(true);

    try {
      // Buscar informações do usuário
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('email, phone, location')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Não foi possível obter as informações do usuário');
      }

      // Fazer upload da imagem
      const imagePath = `item-${Date.now()}-${newItem.image.name}`;
      const { error: uploadError } = await supabase.storage
        .from('marketplace-images')
        .upload(imagePath, newItem.image, { upsert: true });

      if (uploadError) throw uploadError;

      // Inserir item no banco de dados
      const { error: dbError } = await supabase
        .from('marketplace_items')
        .insert({
          title: newItem.title,
          description: newItem.description,
          price: newItem.type === 'produto' ? newItem.price : null,
          image_path: imagePath,
          category: newItem.category,
          type: newItem.type,
          posted_by: user.user_metadata?.nome || 'Anônimo',
          location: userData.location || 'Local desconhecido',
          user_id: user.id,
        });

      if (dbError) throw dbError;

      // Atualizar lista de itens
      const { data } = await supabase
        .from('marketplace_items')
        .select('*')
        .order('created_at', { ascending: false });

      setItems(data || []);
      setIsAddingItem(false);
      setNewItem({
        title: '',
        description: '',
        price: '',
        category: 'Higiene',
        type: 'produto',
        image: null,
      });

    } catch (error) {
      console.error('Erro ao publicar item:', error);
      alert('Ocorreu um erro ao publicar seu item. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Excluir item
  const handleDeleteItem = async (id: number, imagePath: string) => {
    if (!user) return;
    
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      // Excluir imagem do storage
      await supabase.storage
        .from('marketplace-images')
        .remove([imagePath]);

      // Excluir item do banco de dados
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar lista de itens
      setItems(prev => prev.filter(item => item.id !== id));

    } catch (error) {
      console.error('Erro ao excluir item:', error);
      alert('Ocorreu um erro ao excluir o item.');
    }
  };

  // Função para comprar/ver detalhes
  const handleItemAction = async (item: MarketplaceItem) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Buscar informações de contato do vendedor
    const { data: sellerData, error } = await supabase
      .from('usuarios')
      .select('email, phone')
      .eq('id', item.user_id)
      .single();

    if (error || !sellerData) {
      alert('Não foi possível obter as informações de contato do vendedor');
      return;
    }

    if (item.type === 'produto') {
      alert(`Você selecionou o produto: ${item.title}\nEntre em contato com o vendedor:\nEmail: ${sellerData.email}\nTelefone: ${sellerData.phone}`);
    } else {
      alert(`Você selecionou o item para troca: ${item.title}\nEntre em contato com o vendedor:\nEmail: ${sellerData.email}\nTelefone: ${sellerData.phone}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white pb-12 pt-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                <ShoppingBag className="w-8 h-8 mr-3" />
                Marketplace Sustentável
              </h1>
              <p className="text-green-100">
                Compre produtos ecológicos ou troque itens usados
              </p>
            </div>
            {user && activeTab === 'market' && (
              <button
                onClick={() => setIsAddingItem(true)}
                className="mt-4 md:mt-0 bg-white text-green-700 hover:bg-gray-100 px-6 py-2 rounded-lg font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Vender Item
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Abas de navegação */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-6 py-3 font-medium text-lg flex items-center ${
              activeTab === 'market' 
                ? 'border-b-2 border-green-600 text-green-800' 
                : 'text-gray-600 hover:text-green-700'
            }`}
            onClick={() => setActiveTab('market')}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Produtos à Venda
          </button>
          {user && (
            <button
              className={`px-6 py-3 font-medium text-lg flex items-center ${
                activeTab === 'my-items' 
                  ? 'border-b-2 border-green-600 text-green-800' 
                  : 'text-gray-600 hover:text-green-700'
              }`}
              onClick={() => setActiveTab('my-items')}
            >
              <User className="w-5 h-5 mr-2" />
              Meus Produtos
            </button>
          )}
        </div>
      </div>

      {/* Filtros e Busca - Mostrar apenas na aba de mercado */}
      {activeTab === 'market' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="relative w-full md:w-1/2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="text-gray-400 w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Buscar produtos ou itens para troca..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveFilter('todos')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  activeFilter === 'todos'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter('produto')}
                className={`px-4 py-2 rounded-lg text-sm flex items-center transition ${
                  activeFilter === 'produto'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Leaf className="w-4 h-4 mr-1" /> Produtos
              </button>
              <button
                onClick={() => setActiveFilter('troca')}
                className={`px-4 py-2 rounded-lg text-sm flex items-center transition ${
                  activeFilter === 'troca'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Recycle className="w-4 h-4 mr-1" /> Trocas
              </button>
            </div>
          </div>

          {/* Categorias */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-green-600" /> Categorias
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('todos')}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  activeCategory === 'todos'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Todas
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    activeCategory === category
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Botão para adicionar novo item - Mostrar apenas na aba "Meus Produtos" */}
      {activeTab === 'my-items' && user && (
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">
          <button
            onClick={() => setIsAddingItem(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Adicionar Novo Item
          </button>
        </div>
      )}

      {/* Formulário para adicionar novo item */}
      {isAddingItem && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-green-600" />
              Adicionar Novo Item
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Título *</label>
                  <input
                    type="text"
                    name="title"
                    value={newItem.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nome do produto/item"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Descrição *</label>
                  <textarea
                    name="description"
                    value={newItem.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Descreva seu produto/item"
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Categoria *</label>
                    <select
                      name="category"
                      value={newItem.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Tipo *</label>
                    <select
                      name="type"
                      value={newItem.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="produto">Produto</option>
                      <option value="troca">Troca/Doação</option>
                    </select>
                  </div>
                </div>

                {newItem.type === 'produto' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Preço *</label>
                    <input
                      type="text"
                      name="price"
                      value={newItem.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: R$ 25,00"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Imagem *</label>
                  {newItem.image ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <img 
                        src={URL.createObjectURL(newItem.image)} 
                        alt="Preview" 
                        className="max-h-60 mx-auto mb-4 rounded-lg"
                      />
                      <button
                        onClick={() => setNewItem(prev => ({ ...prev, image: null }))}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remover imagem
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-700">
                          <span className="font-semibold">Clique para fazer upload</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG (Máx. 5MB)
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setIsAddingItem(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitItem}
                    disabled={uploading}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      uploading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {uploading ? 'Publicando...' : 'Publicar Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Grid de Itens - Mercado */}
        {activeTab === 'market' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredMarketItems.length === 0 ? (
                  <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">Nenhum item encontrado</h3>
                    <p className="text-gray-500 mt-2 mb-4">Tente ajustar seus filtros de busca</p>
                    <button 
                      onClick={() => {
                        setActiveFilter('todos');
                        setActiveCategory('todos');
                        setSearchTerm('');
                      }}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  filteredMarketItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition border border-gray-200"
                    >
                      <div className="h-48 bg-gray-100 relative overflow-hidden">
                        {item.image_path && (
                          <img 
                            src={getImageUrl(item.image_path)} 
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                        )}
                        <div className="absolute top-3 left-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.type === 'produto' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.type === 'produto' ? 'Produto' : 'Troca/Doação'}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-800 border border-gray-200">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{item.description}</p>
                        
                        <div className="flex items-center text-xs text-gray-500 mb-4">
                          <span className="mr-2">{item.posted_by}</span>
                          <span className="flex-1 border-b border-dashed border-gray-300"></span>
                          <span>{item.location}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          {item.type === 'produto' ? (
                            <span className="text-base font-bold text-green-700">{item.price}</span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full">
                              Troca ou Doação
                            </span>
                          )}
                          
                          <button 
                            onClick={() => handleItemAction(item)}
                            className="text-green-600 hover:text-green-800 font-medium flex items-center text-sm"
                          >
                            {item.type === 'produto' ? 'Comprar' : 'Ver detalhes'} <ArrowRight className="ml-1 w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Meus Produtos */}
        {activeTab === 'my-items' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="h-48 bg-gray-200 animate-pulse"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {myItems.length === 0 && !isAddingItem ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">Você ainda não tem produtos cadastrados</h3>
                    <p className="text-gray-500 mt-2">Adicione seu primeiro item para começar a vender ou trocar</p>
                    <button
                      onClick={() => setIsAddingItem(true)}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center mx-auto"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Adicionar Item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {myItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition border border-gray-200 relative"
                      >
                        {/* Botões de editar/excluir */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            className="bg-red-100 p-1.5 rounded-full hover:bg-red-200 transition"
                            onClick={() => handleDeleteItem(item.id, item.image_path)}
                          >
                            <Trash className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        
                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                          {item.image_path && (
                            <img 
                              src={getImageUrl(item.image_path)} 
                              alt={item.title}
                              className="w-full h-full object-cover hover:scale-105 transition duration-300"
                            />
                          )}
                          <div className="absolute top-3 left-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.type === 'produto' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.type === 'produto' ? 'Produto' : 'Troca/Doação'}
                            </span>
                          </div>
                          <div className="absolute bottom-3 left-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-800 border border-gray-200">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                          <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{item.description}</p>
                          
                          <div className="flex items-center text-xs text-gray-500 mb-4">
                            <span className="mr-2">Status: Ativo</span>
                            <span className="flex-1 border-b border-dashed border-gray-300"></span>
                            <span>{item.location}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            {item.type === 'produto' ? (
                              <span className="text-base font-bold text-green-700">{item.price}</span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-500 text-white text-xs rounded-full">
                                Troca ou Doação
                              </span>
                            )}
                            
                            <button 
                              onClick={() => handleItemAction(item)}
                              className="text-green-600 hover:text-green-800 font-medium flex items-center text-sm"
                            >
                              Ver detalhes <ArrowRight className="ml-1 w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Seção de Trocas - Mostrar apenas na aba de mercado */}
      {activeTab === 'market' && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="flex flex-col md:flex-row items-center mb-8">
              <div className="bg-amber-100 p-3 rounded-lg mr-0 md:mr-6 mb-4 md:mb-0">
                <RefreshCw className="w-8 h-8 text-amber-700" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">Doe ou troque seus itens usados</h2>
                <p className="text-gray-600">
                  Contribua para uma economia circular dando nova vida aos objetos que você não usa mais
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-rose-500" /> Como doar
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Selecione itens em bom estado que você não usa mais</li>
                  <li>• Tire boas fotos e escreva uma descrição clara</li>
                  <li>• Publique no marketplace como "Doação"</li>
                  <li>• Combine a entrega com o interessado</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 text-amber-500" /> Como trocar
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Liste itens que você gostaria de trocar</li>
                  <li>• Especifique o que você aceita em troca</li>
                  <li>• Negocie diretamente com outros usuários</li>
                  <li>• Combine o local seguro para a troca</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chamada para ação - Login */}
      {!user && (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-gray-50 rounded-xl p-8 md:p-12 border-2 border-dashed border-gray-300">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-green-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Cadastre-se para publicar itens</h3>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">
              Faça parte da nossa comunidade sustentável e comece a publicar seus produtos e itens para troca!
            </p>
            <button 
              onClick={() => router.push('/cadastro')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center mx-auto"
            >
              Criar minha conta
            </button>
          </div>
        </div>
      )}
      
      {/* Rodapé */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-green-400" />
                Marketplace Sustentável
              </h3>
              <p className="text-gray-400 text-sm mt-1">Parte do Projeto Destino Certo</p>
            </div>
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} - Feira de Ciências
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}