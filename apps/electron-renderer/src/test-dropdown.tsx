import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

function TestPage() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test DropdownMenu</h1>
      <p>Entorno: {typeof window !== 'undefined' && !window.electronAPI ? 'WEB' : 'ELECTRON'}</p>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Abrir Menú
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Opción 1</DropdownMenuItem>
          <DropdownMenuItem>Opción 2</DropdownMenuItem>
          <DropdownMenuItem>Opción 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <p>Estado del menú: {open ? 'Abierto' : 'Cerrado'}</p>
    </div>
  );
}

export default TestPage;