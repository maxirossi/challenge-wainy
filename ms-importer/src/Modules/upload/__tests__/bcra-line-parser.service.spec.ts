import { Test, TestingModule } from '@nestjs/testing';
import { BcraLineParser, BcraLineData } from '../bcra-line-parser.service';

describe('BcraLineParser', () => {
  let service: BcraLineParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcraLineParser],
    }).compile();

    service = module.get<BcraLineParser>(BcraLineParser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseLine', () => {
    it('should parse a valid BCRA line correctly', () => {
      // Línea real del archivo BCRA
      const line = '0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result).toEqual({
        codigo_entidad: '00007',
        fecha_informacion: '202311',
        tipo_identificacion: '11',
        numero_identificacion: '20003905528',
        actividad: '000',
        situacion: '1',
        prestamos_total_garantias: 10,
      });
    });

    it('should parse another valid BCRA line with different values', () => {
      const line = '0000720231111200058945820141 2406,0      ,0          ,0          ,0          ,0          ,0          2406,0      ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result).toEqual({
        codigo_entidad: '00007',
        fecha_informacion: '202311',
        tipo_identificacion: '11',
        numero_identificacion: '20005894582',
        actividad: '014',
        situacion: '1',
        prestamos_total_garantias: 24060,
      });
    });

    it('should parse line with multiple values and extract the first positive value', () => {
      const line = '0000720231111200173272920001 2062,0      ,0          77,0        ,0          ,0          2062,0      ,0          ,0          77,0        0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(20620);
    });

    it('should return null for empty line', () => {
      const result = service.parseLine('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only line', () => {
      const result = service.parseLine('   ');
      expect(result).toBeNull();
    });

    it('should return null for line that is too short', () => {
      const result = service.parseLine('12345');
      expect(result).toBeNull();
    });

    it('should return null for line with short first part', () => {
      const result = service.parseLine('123 456,0');
      expect(result).toBeNull();
    });

    it('should handle line with no numeric values after first part', () => {
      const line = '0000720231111200039055280001 abc         ,def        ,ghi        ,jkl        ,mno        ,pqr        ,stu        ,vwx        ,yza        ,bcd        ,efg        ,hij';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(0);
    });

    it('should handle line with decimal values', () => {
      const line = '0000720231111200039055280001 123.45      ,0          ,0          ,0          ,0          ,0          123.45      ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(12345);
    });

    it('should handle line with comma-separated values', () => {
      const line = '0000720231111200039055280001 1,234.56    ,0          ,0          ,0          ,0          ,0          1,234.56    ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(123456);
    });

    it('should extract correct fields from first part', () => {
      const line = '1234520231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.codigo_entidad).toBe('12345');
      expect(result!.fecha_informacion).toBe('202311');
      expect(result!.tipo_identificacion).toBe('11');
      expect(result!.numero_identificacion).toBe('20003905528');
    });

    it('should handle line with empty first part fields', () => {
      const line = '0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.actividad).toBe('000');
      expect(result!.situacion).toBe('1');
    });

    it('should handle line with partial first part', () => {
      const line = '0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.actividad).toBe('000');
      expect(result!.situacion).toBe('1');
    });
  });

  describe('parsePrestamosGarantiasFromLine', () => {
    it('should extract first positive numeric value', () => {
      const line = '0000720231111200039055280001 123.45      ,0          ,456.78     ,0          ,0          ,0          123.45      ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(12345);
    });

    it('should return 0 when no positive values found', () => {
      const line = '0000720231111200039055280001 0           ,0          ,0          ,0          ,0          ,0          0           ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(0);
    });

    it('should handle negative values and skip them', () => {
      const line = '0000720231111200039055280001 -123.45     ,0          ,456.78     ,0          ,0          ,0          -123.45     ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(45678);
    });

    it('should handle mixed numeric and non-numeric values', () => {
      const line = '0000720231111200039055280001 abc         ,123.45     ,def        ,0          ,0          ,0          abc         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(12345);
    });
  });

  describe('error handling', () => {
    it('should handle malformed numeric values gracefully', () => {
      const line = '0000720231111200039055280001 abc         ,def        ,ghi        ,0          ,0          ,0          abc         ,0          ,0          ,0          0           0000000';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(0);
    });

    it('should handle line with only non-numeric values', () => {
      const line = '0000720231111200039055280001 abc         ,def        ,ghi        ,jkl        ,mno        ,pqr        abc         ,def        ,ghi        ,jkl        ,mno        ,pqr';
      
      const result = service.parseLine(line);
      
      expect(result).toBeDefined();
      expect(result!.prestamos_total_garantias).toBe(0);
    });
  });
}); 