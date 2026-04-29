import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function CadastroProdutos() {
  const navigate = useNavigate();
  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [estoque, setEstoque] = useState('');
  const [codigoProduto, setCodigoProduto] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCadastrarProduto = async () => {
    if (!nomeProduto || !categoria || !precoVenda) {
      window.alert('Atenção!\nPreencha os campos obrigatórios (Nome, Categoria e Preço de Venda).');
      return;
    }

    setCarregando(true);

    try {
      const produto = {
        nome_produto: nomeProduto.trim(),
        categoria: categoria,
        preco_produto: parseFloat(precoVenda.replace(',', '.')),
        preco_custo: precoCusto ? parseFloat(precoCusto.replace(',', '.')) : 0,
        quantidade_estoque: parseInt(estoque) || 0,
        codigo_produto: codigoProduto.trim() || null
      };

      const response = await apiFetch('/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(produto),
      });

      const data = await response.json();

      if (response.ok) {
        window.alert('SUCESSO!\nProduto cadastrado com sucesso no banco de dados!');
        
        setNomeProduto('');
        setCategoria('');
        setPrecoVenda('');
        setPrecoCusto('');
        setEstoque('');
        setCodigoProduto('');
      } else {
        window.alert('ERRO!\n' + (data.error || 'Erro ao cadastrar produto.'));
      }
      
    } catch (erro) {
      console.error('Erro no cadastro:', erro);
      window.alert('ERRO!\nNão foi possível conectar ao servidor.\n\nVerifique se o backend está rodando:\ncd ~/padaria-cli/servidor\nnode index.js');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url('/assets/images/imagemcadastro.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.6,
        zIndex: 0,
      }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.titulo}>Cadastro de Produtos</Text>
          <Text style={styles.subtitulo}>Preencha os dados do produto</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do Produto *"
            value={nomeProduto}
            onChangeText={setNomeProduto}
          />

          <Text style={styles.label}>Categoria *</Text>
          <View style={styles.categoriaContainer}>
            <TouchableOpacity 
              style={[styles.categoriaBtn, categoria === 'doces' && styles.categoriaAtiva]}
              onPress={() => setCategoria('doces')}
            >
              <Text style={[styles.categoriaTexto, categoria === 'doces' && styles.categoriaTextoAtivo]}>
                🍰 Doces
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoriaBtn, categoria === 'salgados' && styles.categoriaAtiva]}
              onPress={() => setCategoria('salgados')}
            >
              <Text style={[styles.categoriaTexto, categoria === 'salgados' && styles.categoriaTextoAtivo]}>
                🥪 Salgados
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.categoriaBtn, categoria === 'diet' && styles.categoriaAtiva]}
              onPress={() => setCategoria('diet')}
            >
              <Text style={[styles.categoriaTexto, categoria === 'diet' && styles.categoriaTextoAtivo]}>
                🌿 Diet
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Preço de Venda (R$) *"
            value={precoVenda}
            onChangeText={setPrecoVenda}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Preço de Custo (R$)"
            value={precoCusto}
            onChangeText={setPrecoCusto}
            keyboardType="decimal-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Estoque (Quantidade)"
            value={estoque}
            onChangeText={setEstoque}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Código do Produto"
            value={codigoProduto}
            onChangeText={setCodigoProduto}
          />

          <TouchableOpacity 
            style={[styles.botao, carregando && styles.botaoDesabilitado]} 
            onPress={handleCadastrarProduto}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando ? 'CADASTRANDO...' : 'CADASTRAR PRODUTO'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigate('/home')}>
            <Text style={styles.link}>Voltar ao Menu</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d35400',
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },
  input: {
    width: '100%',
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 14,
  },
  label: {
    width: '100%',
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  categoriaContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoriaBtn: {
    flex: 1,
    padding: 10,
    marginHorizontal: 3,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  categoriaAtiva: {
    backgroundColor: '#d35400',
    borderColor: '#d35400',
  },
  categoriaTexto: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoriaTextoAtivo: {
    color: '#fff',
    fontWeight: 'bold',
  },
  botao: {
    width: '100%',
    height: 40,
    backgroundColor: '#d35400',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 3,
  },
  botaoDesabilitado: {
    backgroundColor: '#ccc',
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  link: {
    marginTop: 15,
    color: '#333',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
});