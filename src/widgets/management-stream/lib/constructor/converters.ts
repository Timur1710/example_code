/**
 * Конвертеры между типами конструктора и DTO
 */

import type { ConstructorOperation, ConstructorRelation } from './types';
import type { StreamOperationDto, StreamRelationDto } from 'src/entities/stream/model/stream.types';
import { getUniqueId } from './uniqueId';

/**
 * Конвертирует StreamOperationDto в ConstructorOperation
 */
export function streamDtoToConstructor(dto: StreamOperationDto): ConstructorOperation | null {
  if (!dto._id || !dto.position || !dto.type) {
    return null;
  }

  const operationId = dto._id;

  return {
    _id: operationId,
    position: dto.position as [number, number],
    type: dto.type === 'order' ? 'order' : dto.type === 'operation' ? 'operation' : 'operation',
    ...(dto.status && { status: dto.status }),
    ...(dto.o_id && { o_id: dto.o_id }),
    ...(dto.worker_count !== undefined && { worker_count: dto.worker_count }),
    relation: (dto.relation || []).map((rel) => streamRelationToConstructor(rel, operationId)),
  };
}

/**
 * Конвертирует ConstructorOperation в StreamOperationDto
 */
export function constructorToStreamDto(operation: ConstructorOperation): StreamOperationDto {
  return {
    _id: operation._id,
    position: operation.position,
    type: operation.type === 'order' ? 'order' : 'operation',
    ...(operation.status && { status: operation.status }),
    ...(operation.o_id && { o_id: operation.o_id }),
    ...(operation.worker_count !== undefined && { worker_count: operation.worker_count }),
    relation: operation.relation.map(constructorRelationToStream),
  };
}

/**
 * Конвертирует StreamRelationDto в ConstructorRelation
 * @param dto - DTO связи
 * @param startId - ID начальной операции (необходимо для ConstructorRelation)
 */
function streamRelationToConstructor(dto: StreamRelationDto, startId: string): ConstructorRelation {
  return {
    _id: getUniqueId(),
    so_id: dto.so_id,
    startId,
    firstPointIndex: (dto.firstPointIndex || 0) as 0 | 1 | 2 | 3,
    secondPointIndex: (dto.secondPointIndex || 0) as 0 | 1 | 2 | 3,
    ...(dto.result && { result: dto.result }),
    ...(dto.function && { function: dto.function }),
    ...(dto.condition && { condition: dto.condition }),
    ...(dto.condition_operator && { condition_operator: dto.condition_operator }),
    ...(dto.default !== undefined && { default: dto.default }),
    ...(dto.bgr_color && { bgr_color: dto.bgr_color }),
  };
}

/**
 * Конвертирует ConstructorRelation в StreamRelationDto
 */
function constructorRelationToStream(relation: ConstructorRelation): StreamRelationDto {
  const dto: StreamRelationDto = {
    so_id: relation.so_id,
    firstPointIndex: relation.firstPointIndex,
    secondPointIndex: relation.secondPointIndex,
    // Поле default всегда должно передаваться, иначе бекенд установит default: true
    default: relation.default !== undefined ? relation.default : false,
    ...(relation.result && { result: relation.result }),
    ...(relation.function && { function: relation.function }),
    ...(relation.condition && { condition: relation.condition }),
    ...(relation.condition_operator && { condition_operator: relation.condition_operator }),
    ...(relation.bgr_color && { bgr_color: relation.bgr_color }),
  };
  return dto;
}

/**
 * Конвертирует массив StreamOperationDto в ConstructorOperation[]
 */
export function streamDtosToConstructor(dtos: StreamOperationDto[]): ConstructorOperation[] {
  return dtos.map(streamDtoToConstructor).filter((op): op is ConstructorOperation => op !== null);
}

/**
 * Конвертирует массив ConstructorOperation в StreamOperationDto[]
 */
export function constructorToStreamDtos(operations: ConstructorOperation[]): StreamOperationDto[] {
  return operations.map(constructorToStreamDto);
}
