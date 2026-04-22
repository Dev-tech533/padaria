import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [numeroFuncionario, setNumeroFuncionario] = useState('');
  const [cargo, setCargo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setCpf('');
    setRg('');
    setNumeroFuncionario('');
    setCargo('');
    setSenha('');
    setConfirmaSenha('');
  };

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmaSenha.trim()) {
      window.alert('Atenção:\nPor favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.trim() !== confirmaSenha.trim()) {
      window.alert('Erro:\nAs senhas digitadas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim(),
        rg: rg.trim(),
        numeroFuncionario: numeroFuncionario.trim(),
        cargo: cargo.trim(),
        senha: senha.trim(),
      };

      const response = await apiFetch('/funcionarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível realizar o cadastro.');
      }

      console.log('✅ Funcionário cadastrado no banco:', data);

      limparFormulario();
      window.alert('SUCESSO!\nCadastro realizado com sucesso.\nAgora faça seu login.');
      navigate('/');
    } catch (erro) {
      console.error('Erro no cadastro:', erro);
      window.alert(`Erro ao salvar cadastro.\n${erro.message || 'Tente novamente.'}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <div
        style={{
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
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.titulo}>Cadastro de Funcionários</Text>
          <Text style={styles.subtitulo}>Preencha os dados abaixo</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome Completo *"
            value={nome}
            onChangeText={setNome}
          />

          <TextInput
            style={styles.input}
            placeholder="E-mail *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="CPF"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="RG"
            value={rg}
            onChangeText={setRg}
          />

          <TextInput
            style={styles.input}
            placeholder="Número do Funcionário"
            value={numeroFuncionario}
            onChangeText={setNumeroFuncionario}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Cargo"
            value={cargo}
            onChangeText={setCargo}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha *"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha *"
            value={confirmaSenha}
            onChangeText={setConfirmaSenha}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.botao, carregando && styles.botaoDesabilitado]}
            onPress={handleCadastrar}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando ? 'CADASTRANDO...' : 'CADASTRAR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigate('/')}>
            <Text style={styles.link}>Já tem conta? Voltar ao Login</Text>
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
    color: '#27ae60',
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
  botao: {
    width: '100%',
    height: 40,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 3,
  },
  botaoDesabilitado: {
    opacity: 0.7,
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