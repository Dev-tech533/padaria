import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TeladeLogin from './TeladeLogin';
import Cadastro from './Cadastro';
import Home from './Home';
// Se esses arquivos não existirem, crie-os vazios apenas com um texto "Em construção"
import GerenciarFuncionarios from './GerenciarFuncionarios'; 
import CadastroProdutos from './CadastroProdutos';
import Vendas from './Vendas';
import VendasDoDia from './VendasDoDia';
import ControleEstoque from './ControleEstoque';
import ConsultarVendas from './ConsultarVendas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeladeLogin />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/gerenciar-funcionarios" element={<GerenciarFuncionarios />} />
        <Route path="/cadastro-produtos" element={<CadastroProdutos />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/vendas-do-dia" element={<VendasDoDia />} />
        <Route path="/controle-estoque" element={<ControleEstoque />} />
        <Route path="/consultar-vendas" element={<ConsultarVendas />} />
        <Route path="*" element={<div style={{padding: 50, textAlign:'center'}}><h2>Página não encontrada</h2><a href="/">Voltar</a></div>} />
      </Routes>
    </BrowserRouter>
  );
}