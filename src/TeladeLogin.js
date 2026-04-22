import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './services/api';

const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
};

export default function TeladeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleEntrar = async () => {
    const emailFinal = email ? email.trim() : '';
    const senhaFinal = senha ? senha.trim() : '';

    if (!emailFinal || !senhaFinal) {
      window.alert('ATENÇÃO:\nPor favor, preencha o e-mail e a senha.');
      return;
    }

    setCarregando(true);

    try {
      const response = await apiFetch('/funcionarios');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível verificar o login.');
      }

      const listaUsuarios = Array.isArray(data.funcionarios) ? data.funcionarios : [];

      const usuarioValido = listaUsuarios.find(
        (u) =>
          (u.email || '').trim().toLowerCase() === emailFinal.toLowerCase() &&
          (u.senha || '').trim() === senhaFinal
      );

      if (usuarioValido) {
        window.alert('SUCESSO!\nLogin realizado para: ' + emailFinal);

        setEmail('');
        setSenha('');

        await storage.setItem('usuarioLogado', JSON.stringify(usuarioValido));
        navigate('/home');
      } else {
        window.alert('ERRO:\nE-mail ou senha incorretos.');
      }
    } catch (erro) {
      console.error('Erro no login:', erro);
      window.alert(`Erro ao verificar login.\n${erro.message || 'Tente novamente.'}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <Text style={styles.titulo}>Padaria Sistema</Text>
        <Text style={styles.subtitulo}>Acesse sua conta</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Sua Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.botao, carregando && styles.botaoDesabilitado]}
          onPress={handleEntrar}
          disabled={carregando}
        >
          <Text style={styles.textoBotao}>
            {carregando ? 'ENTRANDO...' : 'ENTRAR'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('/cadastro')}>
          <Text style={styles.link}>Não tem conta? Faça seu Cadastro</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightContainer}>
        <img
          src="/assets/images/pao.png"
          style={{ width: 450, height: 450, maxWidth: '90%', maxHeight: '80%', opacity: 0.95, objectFit: 'contain' }}
          alt="Pão"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    minHeight: '100vh',
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 50,
    paddingLeft: 80,
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d35400',
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  botao: {
    width: '100%',
    height: 50,
    backgroundColor: '#d35400',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  botaoDesabilitado: {
    opacity: 0.7,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  link: {
    marginTop: 20,
    color: '#d35400',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});